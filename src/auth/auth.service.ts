import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import uuid from 'uuid';

import { SigninDto, SignupDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

type Session = { id: string, expiry: number };

@Injectable()
export class AuthService {
    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private prisma: PrismaService,
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

        // This isn't even necessary once an authentication guard is added
        // and will actually be removed later because this is a little problematic as well
        // (scenario - hacker logged into a user's account, user tries to login - "Already Logged In"), yeah no
        const previousSession = await this.cacheManager.get<Session>(`session:${user.id}`);
        if ((previousSession?.expiry || 0) < Date.now())
            await this.cacheManager.del(`session:${user.id}`)
        else if (!!previousSession)
            throw new BadRequestException('Already logged in');

        // After everything's verified, we generate and assign a session ID to the user
        // as well as return the session ID, that the controller can issue a cookie with
        const sessionId = uuid.v4();
        const sessionExpiry = Date.now() + 24 * 60 * 60 * 1000; // 1d

        await this.cacheManager.set<Session>(`session:${user.id}`, { id: sessionId, expiry: sessionExpiry }, 24 * 60 * 60 * 1000);

        return { id: sessionId, expiry: sessionExpiry };
    }
}
