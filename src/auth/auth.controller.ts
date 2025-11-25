import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('signup')
    signup() {
        return this.authService.handleSignup()
    }

    @Post('signin')
    @HttpCode(HttpStatus.OK)
    signin() {
        return this.authService.handleSignin()
    }
}
