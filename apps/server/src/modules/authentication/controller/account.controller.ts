import { ApiTags } from '@nestjs/swagger';

import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ICurrentUser } from '@shared/domain';

import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ParseObjectIdPipe } from '@shared/controller';
import { AccountUc } from '../uc/account.uc';
import { PatchEmailParams, PatchPasswordParams } from './dto';

/* interface MyPassword {
	passwordNew: string;
	passwordOld: string;
} */

@ApiTags('Account')
@Authenticate('jwt')
@Controller('Accounts')
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

	@Patch('me')
	async updateAccountAndUser(@CurrentUser() currentUser: ICurrentUser, params: PatchAccountParams): Promise<unknown> {
		return Promise.resolve();
	}

	@Patch('me/password')
	async changeMyPassword(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() params: PatchPasswordParams
	): Promise<string> {
		await this.accountUc.changeMyPassword(currentUser.userId, params.passwordNew, params.passwordOld);
		return 'dummy response';
	}

	@Patch('me/email')
	async changeMyEmail(@CurrentUser() currentUser: ICurrentUser, @Body() params: PatchEmailParams): Promise<string> {
		await this.accountUc.changeMyEmail(currentUser.userId, params.email);
		return 'dummy response';
	}
}
