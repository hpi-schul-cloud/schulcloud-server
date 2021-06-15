import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';
import { JwtPayload } from '../../authentication/interface/jwt-payload';
import { UserEntity } from '../entity/user.entity';

@Authenticate('jwt')
@Controller('users')
export class UsersController {
	/** default route to test authenticated access */
	@Get('profile')
	getProfile(@CurrentUser() user: JwtPayload): UserEntity {
		return new UserEntity(user);
	}
}
