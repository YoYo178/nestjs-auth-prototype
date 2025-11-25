import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { SigninDto, SignupDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) { }

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
        if(!user)
            throw new BadRequestException('Invalid credentials')

        // Check if password matches its hash from the db
        const passwordMatches = await argon2.verify(user.passwordHash, dto.password);

        // let's also not reveal that the password was wrong
        if(!passwordMatches)
            throw new BadRequestException('Invalid credentials');

        // After everything's verified, we generate and assign a session ID to the user
        // as well as return the session ID, that the controller can issue a cookie with;
        // just that there's no session generation logic yet, so uhh.. TODO!
        const sessionId = 'TODO';

        return sessionId;
    }
}
