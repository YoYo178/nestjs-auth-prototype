import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import uuid from 'uuid';

import { SigninDto, SignupDto } from './dto';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import type { RedisClientType, SetOptions } from 'redis';
import { ConfigService } from '@nestjs/config';
import { SafeUser } from 'src/common/types/user.types';

type Session = { userId: number, sessionId: string };

@Injectable()
export class AuthService {
    constructor(
        @Inject('REDIS_CLIENT')
        private redis: RedisClientType,

        private prisma: PrismaService,
        private config: ConfigService,
    ) { }

    async handleSignup(dto: SignupDto) {
        const userExists = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        });

        // If user exists, prompt them to signup instead
        if (!!userExists)
            throw new ConflictException('A user already exists with this email, please sign in instead.');

        // Hash password
        const hashedPassword = await argon2.hash(dto.password);

        // Create user
        const createdUser = await this.prisma.user.create({
            data: {
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email,
                passwordHash: hashedPassword
            }
        });

        // Exclude password hash from the object to be returned
        const { passwordHash, ...rest } = createdUser;

        return rest;
    }

    async handleSignin(dto: SigninDto) {

        const user = await this.prisma.user.findUnique({
            where: { email: dto.email }
        });

        // let's not reveal if the user actually exists or not
        if (!user)
            throw new BadRequestException('Invalid credentials')

        // Check if password matches its hash from the db
        const passwordMatches = await argon2.verify(user.passwordHash, dto.password);

        // let's also not reveal that the password was wrong
        if (!passwordMatches)
            throw new BadRequestException('Invalid credentials');

        const existingSessionId = await this.redis.get(`user_session:${user.id}`);
        if (existingSessionId?.length) {
            await this.redis.del(`user_session:${user.id}`);
            await this.redis.del(`session:${existingSessionId}`)
        }

        // After everything's verified, we generate and assign a session ID to the user
        // as well as return the session ID, that the controller can issue a cookie with
        const sessionId = uuid.v4();
        const sessionTTL = this.config.get('SESSION_TTL') || 86400;

        const expirationObject: SetOptions = {
            expiration: {
                type: 'EX',
                value: sessionTTL
            }
        }

        // store session in Redis with TTL
        await this.redis.set(`session:${sessionId}`, JSON.stringify({ userId: user.id, sessionId }), expirationObject);

        // Set a reverse pointer to get sessionId via userId
        await this.redis.set(`user_session:${user.id}`, sessionId, expirationObject);

        return sessionId;
    }

    async handleSignOut(user: SafeUser | null) {
        if(!user)
            return;

        const sessionId = await this.redis.get(`user_session:${user.id}`);

        if (sessionId?.length) {
            await this.redis.del(`session:${sessionId}`)
            await this.redis.del(`user_session:${user.id}`)
        }
    }

    async validateSessionId(sessionId: string) {
        const sessionStr = await this.redis.get(`session:${sessionId}`);

        if (!sessionStr)
            throw new UnauthorizedException();

        const session: Session = JSON.parse(sessionStr);

        if (!session)
            throw new UnauthorizedException('Session expired, Please login again.');

        const user = await this.prisma.user.findUnique({
            where: {
                id: session.userId
            }
        });

        if (!user)
            throw new NotFoundException('User not found');

        const { passwordHash, ...rest } = user;

        return rest;
    }
}
