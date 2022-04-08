import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ICurrentUser } from '@shared/domain';

import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ParseObjectIdPipe } from '@shared/controller';
import { AccountUc } from '../uc/account.uc';
import { ChangePasswordParams, PatchMyAccountParams, PatchMyPasswordParams } from './dto';
import { AccountResponse } from './dto/account.response';

@ApiTags('account')
@Authenticate('jwt')
@Controller('account')
export class AccountController {
	constructor(private readonly accountUc: AccountUc) {}

	@Patch(':id/pw')
	async changePassword(
		@CurrentUser() currentUser: ICurrentUser,
		@Param('id', ParseObjectIdPipe) userId: string,
		@Body() { password }: ChangePasswordParams
	): Promise<void> {
		await this.accountUc.changePasswordForUser(currentUser.userId, userId, password);
	}

	@Patch('me')
	async updateMyAccount(@CurrentUser() currentUser: ICurrentUser, @Body() params: PatchMyAccountParams): Promise<void> {
		return this.accountUc.updateMyAccount(currentUser.userId, params);
	}

	@Patch('me/password')
	async replaceMyPassword(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() params: PatchMyPasswordParams
	): Promise<void> {
		return this.accountUc.replaceMyTemporaryPassword(currentUser.userId, params.password, params.confirmPassword);
	}

	@ApiOperation({ description: 'Finds accounts, currently only by UserId' })
	@Get()
	async findAccount(@Query('userId') userId: string): Promise<AccountResponse> {
		const accountEntity = await this.accountUc.findByUserId(userId);
		const response = new AccountResponse(accountEntity.id);
		return response;
	}
}
