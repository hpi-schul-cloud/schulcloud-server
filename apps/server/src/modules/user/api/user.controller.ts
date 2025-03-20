import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChangeLanguageParams, ResolvedUserResponse, SuccessfulResponse } from './dto';
import { ResolvedUserMapper } from './mapper';
import { UserUc } from './user.uc';

@ApiTags('User')
@JwtAuthentication()
@Controller('user')
export class UserController {
	constructor(private readonly userUc: UserUc) {}

	@Get('me')
	public async me(@CurrentUser() currentUser: ICurrentUser): Promise<ResolvedUserResponse> {
		const [user, permissions] = await this.userUc.me(currentUser.userId);

		// only the root roles of the user get published
		const resolvedUser = ResolvedUserMapper.mapToResponse(user, permissions, user.roles.getItems());

		return resolvedUser;
	}

	@Patch('/language')
	public async changeLanguage(
		@Body() params: ChangeLanguageParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<SuccessfulResponse> {
		const result = await this.userUc.patchLanguage(currentUser.userId, params);

		const successfulResponse = new SuccessfulResponse(result);

		return successfulResponse;
	}
}
