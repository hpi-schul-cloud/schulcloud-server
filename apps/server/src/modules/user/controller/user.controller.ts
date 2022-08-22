import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Patch, SetMetadata, UseInterceptors } from '@nestjs/common';

import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser, Timeout } from '@src/modules/authentication/decorator/auth.decorator';

import { TimeoutInterceptor } from '@shared/common';
import { ResolvedUserMapper } from '../mapper';
import { UserUc } from '../uc/user.uc';

import { ResolvedUserResponse, ChangeLanguageParams, SuccessfulResponse } from './dto';

@ApiTags('User')
@Authenticate('jwt')
@Controller('user')
export class UserController {
	constructor(private readonly userUc: UserUc) {}

	@Get('me')
	@Timeout(43)
	// @SetMetadata('timeout', 42)
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
