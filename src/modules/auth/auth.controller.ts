import { Body, Controller, HttpCode, HttpStatus, InternalServerErrorException, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninDto, SignupDto } from './dto';
import type { Request, Response } from 'express';
import { AuthGuard } from './auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { SafeUser } from 'src/common/types/user.types';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('signup')
    signup(@Body() dto: SignupDto) {
        return this.authService.handleSignup(dto)
    }

    @Post('signin')
    @HttpCode(HttpStatus.NO_CONTENT)
    async signin(
        @Body() dto: SigninDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const sessionId = await this.authService.handleSignin(dto);

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

    @Post('signout')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(AuthGuard)
    async signout(@Res({ passthrough: true }) res: Response, @GetUser() user: SafeUser | null) {
        res.clearCookie('sid');
        await this.authService.handleSignOut(user);
    }
}
