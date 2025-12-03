import { CanActivate, ExecutionContext, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly authService: AuthService) { }

    async canActivate(ctx: ExecutionContext): Promise<boolean> {
        const request = ctx.switchToHttp().getRequest<Request>();
        const sessionId = request.cookies['sid'];

        try {
            if (!sessionId)
                throw new UnauthorizedException();

            const user = await this.authService.validateSessionId(sessionId);

            // Highly unlikely again, but just in case...
            if (!user)
                throw new NotFoundException('User not found');

            request['user'] = user;

            return true;
        } catch (err) {
            // If anything bad happened due to the cookie, we most probably don't need it to stay
            const response = ctx.switchToHttp().getResponse<Response>();
            response.clearCookie('sid');

            throw err;
        }
    }
}