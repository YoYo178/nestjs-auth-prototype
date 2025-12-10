import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { RedisClientType } from 'redis';
import uuid from 'uuid';
import type { SetOptions } from 'redis';
import { ConfigService } from '@nestjs/config';

type Session = { userId: number, sessionId: string };

@Injectable()
export class SessionService {
    constructor(
        @Inject('REDIS_CLIENT')
        private redisService: RedisClientType,
        private configService: ConfigService
    ) { }
    async createSession(userId: number) {
        // After everything's verified, we generate and assign a session ID to the user
        // as well as return the session ID, that the controller can issue a cookie with
        const sessionId = uuid.v4();
        const sessionTTL = this.configService.get('SESSION_TTL') || 86400;

        const expirationObject: SetOptions = {
            expiration: {
                type: 'EX',
                value: sessionTTL
            }
        }

        // store session in Redis with TTL
        await this.redisService.set(`session:${sessionId}`, JSON.stringify({ userId, sessionId }), expirationObject);

        // Set a reverse pointer to get sessionId via userId
        await this.redisService.set(`user_session:${userId}`, sessionId, expirationObject);

        return sessionId;
    }

    async clearSession(userId: number) {
        const sessionId = await this.redisService.get(`user_session:${userId}`);
        if (sessionId?.length) {
            await this.redisService.del(`user_session:${userId}`);
            await this.redisService.del(`session:${sessionId}`);
        }
    }

    async validateSession(sessionId: string) {
        const sessionStr = await this.redisService.get(`session:${sessionId}`);

        if (!sessionStr)
            throw new UnauthorizedException();

        const session: Session = JSON.parse(sessionStr);

        if (!session)
            throw new UnauthorizedException('Session expired, Please login again.');

        return session.userId;
    }
}
