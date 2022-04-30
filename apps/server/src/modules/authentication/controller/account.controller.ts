import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@shared/domain';
import { EntityNotFoundError, ForbiddenOperationError, ValidationError } from '@shared/common';
import { AccountUc } from '../uc/account.uc';
import {
	AccountByIdBodyParams,
	AccountByIdParams,
	AccountResponse,
	AccountSearchListResponse,
	AccountSearchQueryParams,
	PatchMyAccountParams,
	PatchMyPasswordParams,
} from './dto';

@ApiTags('Account')
@Authenticate('jwt')
@Controller('account')
export class AccountController {
	constructor(private readonly accountUc: AccountUc) {}

	@Get()
	@ApiOperation({ summary: 'Returns all accounts which satisfies the given criteria. Superhero role is REQUIRED.' })
	@ApiResponse({ status: 200, type: AccountSearchListResponse, description: 'Returns a paged list of accounts.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'User is not a superhero.' })
	@ApiResponse({ status: 404, type: EntityNotFoundError, description: 'User id not found.' })
	async searchAccounts(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() query: AccountSearchQueryParams
	): Promise<AccountSearchListResponse> {
		return this.accountUc.searchAccounts(currentUser, query);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Returns an account with given id. Superhero role is REQUIRED.' })
	@ApiResponse({ status: 200, type: AccountResponse, description: 'Returns the account.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'User is not a superhero.' })
	@ApiResponse({ status: 404, type: EntityNotFoundError, description: 'Account not found.' })
	async findAccountById(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: AccountByIdParams
	): Promise<AccountResponse> {
		return this.accountUc.findAccountById(currentUser, params);
	}

	// IMPORTANT!!!
	// updateMyAccount has to occur before updateAccountById, because Nest.js
	// will always use the first path match and me will be treated as a path parameter
	// (some e2e tests might fail, if the method order is changed)
	@Patch('me')
	@ApiOperation({ summary: 'Updates an account for the authenticated user.' })
	@ApiResponse({ status: 200, description: 'Account was successfully updated.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'Invalid password.' })
	@ApiResponse({ status: 404, type: EntityNotFoundError, description: 'Account not found.' })
	async updateMyAccount(@CurrentUser() currentUser: ICurrentUser, @Body() params: PatchMyAccountParams): Promise<void> {
		return this.accountUc.updateMyAccount(currentUser.userId, params);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Updates an account with given id. Superhero role is REQUIRED.' })
	@ApiResponse({ status: 200, type: AccountResponse, description: 'Returns updated account.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'User is not a superhero.' })
	@ApiResponse({ status: 404, type: EntityNotFoundError, description: 'Account not found.' })
	async updateAccountById(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: AccountByIdParams,
		@Body() body: AccountByIdBodyParams
	): Promise<AccountResponse> {
		return this.accountUc.updateAccountById(currentUser, params, body);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Deletes an account with given id. Superhero role is REQUIRED.' })
	@ApiResponse({ status: 200, type: AccountResponse, description: 'Returns deleted account.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'User is not a superhero.' })
	@ApiResponse({ status: 404, type: EntityNotFoundError, description: 'Account not found.' })
	async deleteAccountById(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: AccountByIdParams
	): Promise<AccountResponse> {
		return this.accountUc.deleteAccountById(currentUser, params);
	}

	@Patch('me/password')
	@ApiOperation({ summary: 'Updates the the temporary account password for the authenticated user.' })
	@ApiResponse({ status: 200, description: 'Updated the temporary password successfully.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'Invalid password.' })
	@ApiResponse({ status: 404, type: EntityNotFoundError, description: 'Account or user not found.' })
	async replaceMyPassword(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() params: PatchMyPasswordParams
	): Promise<void> {
		return this.accountUc.replaceMyTemporaryPassword(currentUser.userId, params.password, params.confirmPassword);
	}
}
