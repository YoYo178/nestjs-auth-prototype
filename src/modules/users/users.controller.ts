import { Controller, Get, HttpCode, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { SafeUser } from 'src/common/types/user.types';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {

    @Get('me')
    @HttpCode(200)
    getMe(@GetUser() user: SafeUser | null) {
        return user
    }

}
