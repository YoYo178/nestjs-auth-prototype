import { Controller, Get, HttpCode, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../security/guards/auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { SafeUser } from 'src/common/types/user.types';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@Controller('users')
@UseGuards(ThrottlerGuard, AuthGuard)
export class UsersController {

    @Throttle({ default: { ttl: 10000, limit: 5 } })
    @Get('me')
    @HttpCode(200)
    getMe(@GetUser() user: SafeUser | null) {
        return user
    }

}
