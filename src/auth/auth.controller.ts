import { Body, Controller, HttpCode, HttpStatus, InternalServerErrorException, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninDto, SignupDto } from './dto';
import type { Response } from 'express';

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
        @Res({ passthrough: true }) res: Response
    ) {
        const session = await this.authService.handleSignin(dto);

        // Highly unlikely, but possible
        if (!session?.id)
            throw new InternalServerErrorException('Failed to generate session ID');

        // TODO: must be configured based on the environment (production or development)
        res.cookie('sid', session.id, {
            httpOnly: true,
            sameSite: 'strict',
            secure: false
        });
    }
}
