import { CanActivate, ExecutionContext, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly authService: AuthService) {}
    
    async canActivate(ctx: ExecutionContext): Promise<boolean> {
        const request = ctx.switchToHttp().getRequest<Request>();
        const sessionId = request.cookies['sid'];

        if(!sessionId)
            throw new UnauthorizedException();

        const user = await this.authService.validateSessionId(sessionId);

        // Highly unlikely again, but just in case...
        if(!user)
            throw new NotFoundException('User not found');

        request['user'] = user;

        return true;
    }
}