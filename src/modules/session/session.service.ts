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

        // get existing sessions
        const sessions = await this.getSessions(userId);

        // add the new session in the list
        sessions.push(sessionId);

        // Set a reverse pointer to get sessionId via userId
        await this.redisService.set(`user_sessions:${userId}`, JSON.stringify(sessions), expirationObject);

        return sessionId;
    }

    async clearSession(userId: number, sessionId: string) {
        await this.redisService.del(`session:${sessionId}`);

        const sessions = await this.getSessions(userId);
        const updatedSesssions = sessions.filter(sid => sid !== sessionId);
        await this.redisService.set(`user_sessions:${userId}`, JSON.stringify(updatedSesssions));
    }

    async clearAllSessions(userId: number) {
        const sessions = await this.getSessions(userId);

        await Promise.all(
            sessions.map(sessionId => this.redisService.del(`session:${sessionId}`))
        )

        await this.redisService.del(`user_sessions:${userId}`);
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

    async getSessions(userId: number) {
        const sessionsStr = await this.redisService.get(`user_sessions:${userId}`);
        if (!sessionsStr?.length)
            return [];

        try {
            return JSON.parse(sessionsStr) as string[];
        } catch {
            return [];
        }
    }
}
