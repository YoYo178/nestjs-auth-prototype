import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, of, tap } from "rxjs";
import type { RedisClientType } from "redis";
import { Request } from "express";

@Injectable()
export class CacheInterceptor implements NestInterceptor {
    private cacheTTL = 300; // in seconds

    constructor(
        @Inject('REDIS_CLIENT')
        private redis: RedisClientType
    ) { }

    async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
        const req = context.switchToHttp().getRequest<Request>();
        const user = req.user;

        if (!user)
            return next.handle();

        const route = req.url;
        const key = `route_cache:${route}:${user.id}`;
        const cached = await this.redis.get(key);

        if (cached)
            return of(JSON.parse(cached));

        return next
            .handle()
            .pipe(
                tap(async (result) => {
                    await this.redis.set(key, JSON.stringify(result), {
                        expiration: {
                            type: 'EX',
                            value: this.cacheTTL
                        }
                    })
                })
            )
    }
}
