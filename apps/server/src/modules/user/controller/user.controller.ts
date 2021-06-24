import { ApiTags } from '@nestjs/swagger';

import { Controller, Get } from '@nestjs/common';
import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';
import { ICurrentUser } from '../../authentication/interface/jwt-payload';
import { UserUC } from '../uc';
import { ResolvedUser } from './dto/ResolvedUser.dto';

@ApiTags('User')
@Authenticate('jwt')
@Controller('user')
export class UserController {
	constructor(private readonly userUc: UserUC) {}

	@Get('me')
	async get(@CurrentUser() currentUser: ICurrentUser): Promise<ResolvedUser> {
		return Promise.resolve(currentUser.user);
	}
}
