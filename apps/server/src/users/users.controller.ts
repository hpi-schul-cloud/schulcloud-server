import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { Authenticate, CurrentUser } from '../auth/auth.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload';
import { UserEntity } from './entities/user.entity';

@Authenticate('jwt')
@Controller('users')
export class UsersController {
	/** default route to test authenticated access */
	@Get('profile')
	getProfile(@CurrentUser() user: JwtPayload): UserEntity {
		return new UserEntity(user);
	}
}
