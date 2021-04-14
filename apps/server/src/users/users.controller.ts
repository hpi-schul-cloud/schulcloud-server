import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { Authenticate } from '../auth/auth.decorator';
import { UserEntity } from './Entities/user.entity';

@Authenticate('jwt')
@Controller('users')
export class UsersController {
	/** default route to test authenticated access */
	@Get('profile')
	getProfile(@Request() req): UserEntity {
		return new UserEntity(req.user);
	}
}
