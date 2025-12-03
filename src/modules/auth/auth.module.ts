import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/modules/prisma/prisma.module';
import { RedisModule } from 'src/modules/redis/redis.module';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [AuthService, AuthGuard],
  controllers: [AuthController],
  exports: [AuthGuard, AuthService]
})
export class AuthModule {}
