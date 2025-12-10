import { Body, Controller, Delete, Get, HttpCode, HttpStatus, InternalServerErrorException, Param, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninDto, SignupDto } from './dto';
import type { Request, Response } from 'express';
import { AuthGuard } from '../security/guards/auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { SafeUser } from 'src/common/types/user.types';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Throttle({ default: { ttl: 30000, limit: 10 } })
    @Post('signup')
    signup(@Body() dto: SignupDto) {
        return this.authService.handleSignup(dto)
    }

    @Throttle({ default: { ttl: 60000, limit: 10 } })
    @Post('signin')
    @HttpCode(HttpStatus.NO_CONTENT)
    async signin(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
        @Body() dto: SigninDto,
    ) {
        const clientSid = req.cookies?.['sid'];
        const sessionId = await this.authService.handleSignin(dto, clientSid);

        // Highly unlikely, but possible
        if (!sessionId)
            throw new InternalServerErrorException('Failed to generate session ID');

        // TODO: must be configured based on the environment (production or development)
        res.cookie('sid', sessionId, {
            httpOnly: true,
            sameSite: 'strict',
            secure: false
        });
    }

    @Throttle({ default: { ttl: 10000, limit: 10 } })
    @UseGuards(AuthGuard)
    @Post('signout')
    @HttpCode(HttpStatus.NO_CONTENT)
    async signout(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
        @GetUser() user: SafeUser | null,
    ) {
        const clientSid = req.cookies['sid'];

        res.clearCookie('sid');
        await this.authService.handleSignOut(user, clientSid);
    }

    @UseGuards(AuthGuard)
    @Get('sessions')
    async getSessions(@GetUser() user: SafeUser | null) {
        if (!user)
            return new UnauthorizedException();

        const sessions = await this.authService.getSessions(user.id);
        return sessions;
    }

    @UseGuards(AuthGuard)
    @Delete('sessions/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteSession(
        @GetUser() user: SafeUser | null,
        @Param('id') id: string
    ) {
        if (!user)
            return new UnauthorizedException();

        await this.authService.clearSession(user.id, id)
    }

    @UseGuards(AuthGuard)
    @Delete('sessions')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteAllSessions(@GetUser() user: SafeUser | null) {
        if (!user)
            return new UnauthorizedException();

        await this.authService.clearAllSessions(user.id);
    }
}
