import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SecurityModule } from '../security/security.module';
import { UsersModule } from '../users/users.module';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [UsersModule, SessionModule, SecurityModule],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService]
})
export class AuthModule {}
