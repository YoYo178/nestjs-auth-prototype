import { Module } from '@nestjs/common';
import { AuthGuard } from './guards/auth.guard';
import { SessionModule } from '../session/session.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [SessionModule, UsersModule],
    providers: [AuthGuard],
    exports: [AuthGuard],
})
export class SecurityModule { }
