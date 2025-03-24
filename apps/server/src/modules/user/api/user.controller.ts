import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Body, Controller, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChangeLanguageParams, SuccessfulResponse } from './dto';
import { UserUc } from './user.uc';

@ApiTags('User')
@JwtAuthentication()
@Controller('user')
export class UserController {
	constructor(private readonly userUc: UserUc) {}

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
