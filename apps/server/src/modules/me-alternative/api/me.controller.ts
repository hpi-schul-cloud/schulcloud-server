import { Controller, Get } from '@nestjs/common';
import { GetMeUc } from '../uc/get-me.uc';
import { CurrentUser, ICurrentUser, JwtAuthentication } from '@src/infra/auth-guard';
import { ApiTags } from '@nestjs/swagger';

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
