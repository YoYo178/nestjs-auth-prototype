import { CanActivate, ExecutionContext, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { SessionService } from 'src/modules/session/session.service';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private sessionService: SessionService,
    private usersService: UsersService
  ) { }

  async canActivate(
    context: ExecutionContext,
  ) {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionId = request.cookies['sid'];

    try {
      if (!sessionId)
        throw new UnauthorizedException();

      const userId = await this.sessionService.validateSession(sessionId);
      const user = await this.usersService.getUserById(userId);

      // Highly unlikely again, but just in case...
      if (!user)
        throw new NotFoundException('User not found');

      request['user'] = user;

      return true;
    } catch (err) {
      // If anything bad happened due to the cookie, we most probably don't need it to stay
      const response = context.switchToHttp().getResponse<Response>();
      response.clearCookie('sid');

      throw err;
    }
  }
}
