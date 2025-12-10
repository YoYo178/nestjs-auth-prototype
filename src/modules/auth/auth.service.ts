import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

import { SigninDto, SignupDto } from './dto';
import { SafeUser } from 'src/common/types/user.types';
import { UsersService } from '../users/users.service';
import { SessionService } from '../session/session.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private sessionService: SessionService
    ) { }

    async handleSignup(dto: SignupDto) {
        const userExists = await this.usersService.getUserByEmail(dto.email);

        // If user exists, prompt them to signup instead
        if (!!userExists)
            throw new ConflictException('A user already exists with this email, please sign in instead.');

        // Hash password
        const hashedPassword = await argon2.hash(dto.password);

        // Create user
        const createdUser = await this.usersService.createUser({
            ...dto,
            passwordHash: hashedPassword
        })

        // Exclude password hash from the object to be returned
        const { passwordHash, ...rest } = createdUser;

        return rest;
    }

    async handleSignin(dto: SigninDto) {
        const userId = await this.usersService.validateCredentials(dto);

        await this.sessionService.clearSession(userId);

        const sessionId = await this.sessionService.createSession(userId);

        return sessionId;
    }

    async handleSignOut(user: SafeUser | null) {
        if (!user)
            return;

        await this.sessionService.clearSession(user.id);
    }
}
