import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import uuid from 'uuid';

import { SigninDto, SignupDto } from './dto';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import type { RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';

type Session = { id: string, expiry: number };

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

    async handleSignin(dto: SigninDto, clientSid: string) {

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

        // temporary!! until a proper auth guard is added!
        const previousSessionStr = await this.redis.get(`session:${clientSid}`);
        if (previousSessionStr?.length) {
            const previousSession = JSON.parse(previousSessionStr);

            if (!!previousSession) {
                if (previousSession.expiry < Date.now())
                    await this.redis.del(`session:${clientSid}`)
                else
                    throw new ConflictException('You already have an existing session!');
            }
        }

        // After everything's verified, we generate and assign a session ID to the user
        // as well as return the session ID, that the controller can issue a cookie with
        const sessionId = uuid.v4();
        const sessionTTL = this.config.get('SESSION_TTL') || 86400;
        const sessionExpiry = Date.now() + (sessionTTL * 1000)
        // store session in Redis with TTL
        await this.redis.set(
            `session:${sessionId}`,
            JSON.stringify({
                userId: user.id,
                sessionId,
                expiry: sessionExpiry
            }),
            {
                expiration: {
                    type: 'EX',
                    value: sessionTTL
                }
            }
        );

        return sessionId;
    }
}
