import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Patch } from '@nestjs/common';

import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';

import { ResolvedUserMapper } from '../mapper';
import { UserUC } from '../uc/user.uc';

import { ResolvedUserResponse, ChangeLanguageParams, SuccessfulResponse } from './dto';

@ApiTags('User')
@Authenticate('jwt')
@Controller('user')
export class UserController {
	constructor(private readonly userUc: UserUC) {}

	@Get('me')
	async me(@CurrentUser() currentUser: ICurrentUser): Promise<ResolvedUserResponse> {
		const [user, permissions] = await this.userUc.me(currentUser.userId);

		// only the root roles of the user get published
		const resolvedUser = ResolvedUserMapper.mapToResponse(user, permissions, user.roles.getItems());

		return resolvedUser;
	}

	@Patch('/language')
	async changeLanguage(
		@Body() params: ChangeLanguageParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<SuccessfulResponse> {
		const result = await this.userUc.patchLanguage(currentUser.userId, params);

		const successfulResponse = new SuccessfulResponse(result);

		return successfulResponse;
	}
}
