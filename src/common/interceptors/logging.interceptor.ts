import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Request } from "express";
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private logger: Logger;

    constructor() {
        this.logger = new Logger(LoggingInterceptor.name)
    }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const now = Date.now();
        const req = context.switchToHttp().getRequest<Request>();

        return next
            .handle()
            .pipe(
                tap(() => this.logger.log(`${req.method} ${req.url} - ${Date.now() - now}ms`)),
            )
    }
}