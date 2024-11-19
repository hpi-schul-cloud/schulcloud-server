import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MeResponse } from './dto';
import { MeUc } from './me.uc';

@ApiTags('Me')
@JwtAuthentication()
@Controller('me')
export class MeController {
	constructor(private readonly meUc: MeUc) {}

	@ApiOperation({ summary: 'Resolve jwt and response informations about the owner of the jwt.' })
	@ApiResponse({ status: 200, type: MeResponse })
	@Get()
	public async me(@CurrentUser() currentUser: ICurrentUser): Promise<MeResponse> {
		const res = await this.meUc.getMe(
			currentUser.userId,
			currentUser.schoolId,
			currentUser.accountId,
			currentUser.systemId
		);

		return res;
	}
}
