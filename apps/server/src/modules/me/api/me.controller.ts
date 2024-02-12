import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MeResponse } from './dto';
import { MeUc } from './me.uc';

@ApiTags('Me')
@Authenticate('jwt')
@Controller('me')
export class MeController {
	constructor(private readonly meUc: MeUc) {}

	@Get()
	public async me(@CurrentUser() currentUser: ICurrentUser): Promise<MeResponse> {
		const res = await this.meUc.getMe(currentUser.userId, currentUser.schoolId, currentUser.accountId);

		return res;
	}
}
