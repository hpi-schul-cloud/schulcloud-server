import { ApiTags } from '@nestjs/swagger';

import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ICurrentUser } from '@shared/domain';

import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ParseObjectIdPipe } from '@shared/controller';
import { AccountUc } from '../uc/account.uc';
import { Password } from './dto/password.param';

@ApiTags('Account')
@Authenticate('jwt')
@Controller('Account')
export class AccountController {
	constructor(private readonly accountUc: AccountUc) {}

	@Get(':id/pw')
	dummyGet(@Param('id') userId: string) {
		console.log('GET account request received', userId);
		return 'dummy response';
	}

	@Patch(':id/pw')
	async changePassword(
		@CurrentUser() currentUser: ICurrentUser,
		@Param('id', ParseObjectIdPipe) userId: string,
		@Body() { password }: Password
	): Promise<string> {
		await this.accountUc.changePasswordForUser(currentUser.userId, userId, password);
		return 'dummy response';
	}
}
