import { Body, Controller, Param, Patch, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@shared/domain';
import { ParseObjectIdPipe } from '@shared/controller';
import { AccountUc } from '../uc/account.uc';
import { PatchMyAccountParams, PutMyPasswordParams } from './dto';
import { Password } from './dto/password.param';

/* interface MyPassword {
	passwordNew: string;
	passwordOld: string;
} */

@ApiTags('Account')
@Authenticate('jwt')
@Controller('account')
export class AccountController {
	constructor(private readonly accountUc: AccountUc) {}

	@Patch(':id/pw')
	async changePassword(
		@CurrentUser() currentUser: ICurrentUser,
		@Param('id', ParseObjectIdPipe) userId: string,
		@Body() { password }: Password
	): Promise<void> {
		await this.accountUc.changePassword(currentUser.userId, userId, password);
	}

	@Patch('me')
	async updateMyAccount(@CurrentUser() currentUser: ICurrentUser, @Body() params: PatchMyAccountParams): Promise<void> {
		return this.accountUc.updateMyAccount(currentUser, params);
	}

	@Put('me/password')
	async updateMyPassword(@CurrentUser() currentUser: ICurrentUser, @Body() params: PutMyPasswordParams): Promise<void> {
		return this.accountUc.changeMyTemporaryPassword(currentUser.userId, params.password, params.confirmPassword);
	}
}
