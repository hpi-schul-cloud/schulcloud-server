import { ApiTags } from '@nestjs/swagger';

import { Controller, Get } from '@nestjs/common';
import { ICurrentUser } from '@shared/domain';

import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { UserUC } from '../uc';
import { ResolvedUser } from './dto/ResolvedUser.dto';

@ApiTags('User')
@Authenticate('jwt')
@Controller('user')
export class UserController {
	constructor(private readonly userUc: UserUC) {}

	@Get('me')
	async me(@CurrentUser() currentUser: ICurrentUser): Promise<ResolvedUser> {
		return Promise.resolve(currentUser.user);
	}
}
