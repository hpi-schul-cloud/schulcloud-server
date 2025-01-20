import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetMeUc } from '../uc/get-me.uc';

@ApiTags('Me')
@JwtAuthentication()
@Controller('me-alternative')
export class MeController {
	constructor(private readonly getMeUc: GetMeUc) {}

	@Get()
	public async getMe(@CurrentUser() currentUser: ICurrentUser) {
		const res = this.getMeUc.execute(currentUser);

		return res;
	}
}
