import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { RedisModule } from '../redis/redis.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    RedisModule,
  ],
  providers: [SessionService],
  exports: [SessionService]
})
export class SessionModule { }
