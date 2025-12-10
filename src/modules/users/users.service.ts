import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NewUser } from 'src/common/types/user.types';
import * as argon2 from 'argon2';
import { SigninDto } from '../auth/dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async getUserById(id: number) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        return user ?? null;
    }

    async getUserByEmail(email: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        return user ?? null;
    }

    async createUser(dto: NewUser) {
        const user = await this.prisma.user.create({ data: dto });
        return user
    }

    async validateCredentials(dto: SigninDto) {
        const user = await this.getUserByEmail(dto.email);

        if (!user)
            throw new NotFoundException('Invalid credentials');

        // Check if password matches its hash from the db
        const passwordMatches = await argon2.verify(user.passwordHash, dto.password);

        if (!passwordMatches)
            throw new NotFoundException('Invalid credentials');

        return user.id;
    }
}
