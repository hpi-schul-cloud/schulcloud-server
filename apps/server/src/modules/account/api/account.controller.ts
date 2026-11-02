import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EntityNotFoundError, ForbiddenOperationError, ValidationError } from '@shared/common/error';

import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { AccountUc } from './account.uc';
import {
	AccountByIdBodyParams,
	AccountByIdParams,
	AccountResponse,
	PatchMyAccountParams,
	PatchMyPasswordParams,
	UpdateAccountDto,
	UpdateMyAccountDto,
} from './dto';
import { AccountResponseMapper } from './mapper/account-response.mapper';

@ApiTags('Account')
@JwtAuthentication()
@Controller('account')
export class AccountController {
	constructor(private readonly accountUc: AccountUc) {}

	// IMPORTANT!!!
	// updateMyAccount has to occur before updateAccountById, because Nest.js
	// will always use the first path match and me will be treated as a path parameter
	@Patch('me')
	@ApiOperation({ summary: 'Updates an account for the authenticated user.' })
	@ApiResponse({ status: 200, description: 'Account was successfully updated.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'Invalid password.' })
	@ApiResponse({ status: 404, type: EntityNotFoundError, description: 'Account not found.' })
	public updateMyAccount(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() params: PatchMyAccountParams
	): Promise<void> {
		const updateData = new UpdateMyAccountDto(params);
		return this.accountUc.updateMyAccount(currentUser.userId, updateData);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Updates an account with given id. Superhero role is REQUIRED.' })
	@ApiResponse({ status: 200, type: AccountResponse, description: 'Returns updated account.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'User is not a superhero.' })
	@ApiResponse({ status: 404, type: EntityNotFoundError, description: 'Account not found.' })
	public async updateAccountById(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: AccountByIdParams,
		@Body() body: AccountByIdBodyParams
	): Promise<AccountResponse> {
		const updateData = new UpdateAccountDto(body);
		const dto = await this.accountUc.updateAccountById(currentUser, params.id, updateData);

		return AccountResponseMapper.mapToAccountResponse(dto);
	}

	@Patch('me/password')
	@ApiOperation({ summary: 'Updates the the temporary account password for the authenticated user.' })
	@ApiResponse({ status: 200, description: 'Updated the temporary password successfully.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'Invalid password.' })
	@ApiResponse({ status: 404, type: EntityNotFoundError, description: 'Account or user not found.' })
	public replaceMyPassword(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() params: PatchMyPasswordParams
	): Promise<void> {
		return this.accountUc.replaceMyTemporaryPassword(currentUser.userId, params.password, params.confirmPassword);
	}
}
