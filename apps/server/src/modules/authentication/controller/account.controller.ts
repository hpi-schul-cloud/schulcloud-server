import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@shared/domain';
import { ParseObjectIdPipe } from '@shared/controller';
import {
	AuthorizationError,
	EntityNotFoundError,
	ForbiddenOperationError,
	UnauthorizedError,
	ValidationError,
} from '@shared/common';
import { AccountUc } from '../uc/account.uc';
import {
	AccountByIdBody,
	AccountByIdParams,
	AccountByIdResponse,
	AccountSearchListResponse,
	AccountResponse,
	AccountSearchQuery,
	ChangePasswordParams,
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
	@ApiResponse({ status: 401, type: UnauthorizedError, description: 'No JWT or not a superhero.' })
	@ApiResponse({ status: 404, type: EntityNotFoundError, description: 'User id not found.' })
	async searchAccounts(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() query: AccountSearchQuery
	): Promise<AccountSearchListResponse> {
		return this.accountUc.searchAccounts(currentUser, query);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Returns an account with given id. Superhero role is REQUIRED.' })
	@ApiResponse({ status: 200, type: AccountByIdResponse, description: 'Returns the account.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 401, type: UnauthorizedError, description: 'No JWT or not a superhero.' })
	@ApiResponse({ status: 404, type: EntityNotFoundError, description: 'Account not found.' })
	async findAccountById(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: AccountByIdParams
	): Promise<AccountByIdResponse> {
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
	@ApiResponse({ status: 401, type: AuthorizationError, description: 'No JWT or invalid password.' })
	@ApiResponse({ status: 404, type: EntityNotFoundError, description: 'Account not found.' })
	async updateMyAccount(@CurrentUser() currentUser: ICurrentUser, @Body() params: PatchMyAccountParams): Promise<void> {
		return this.accountUc.updateMyAccount(currentUser.userId, params);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Updates an account with given id. Superhero role is REQUIRED.' })
	@ApiResponse({ status: 200, type: AccountByIdResponse, description: 'Returns updated account.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 401, type: UnauthorizedError, description: 'No JWT or not a superhero.' })
	@ApiResponse({ status: 404, type: EntityNotFoundError, description: 'Account not found.' })
	async updateAccountById(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: AccountByIdParams,
		@Body() body: AccountByIdBody
	): Promise<AccountByIdResponse> {
		return this.accountUc.updateAccountById(currentUser, params, body);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Deletes an account with given id. Superhero role is REQUIRED.' })
	@ApiResponse({ status: 200, type: AccountByIdResponse, description: 'Returns deleted account.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 401, type: UnauthorizedError, description: 'No JWT or not a superhero.' })
	@ApiResponse({ status: 404, type: EntityNotFoundError, description: 'Account not found.' })
	async deleteAccountById(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: AccountByIdParams
	): Promise<AccountByIdResponse> {
		return this.accountUc.deleteAccountById(currentUser, params);
	}

	@Patch(':id/pw')
	@ApiOperation({ summary: 'Updates the password of an account with given id.' })
	@ApiResponse({ status: 200, description: 'Updated password successfully.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 401, type: UnauthorizedError, description: 'No JWT provided.' })
	@ApiResponse({ status: 403, type: ForbiddenException, description: 'No permission to change the user password.' })
	@ApiResponse({ status: 404, type: EntityNotFoundError, description: 'Account or user not found.' })
	async changePassword(
		@CurrentUser() currentUser: ICurrentUser,
		@Param('id', ParseObjectIdPipe) userId: string,
		@Body() { password }: ChangePasswordParams
	): Promise<void> {
		await this.accountUc.changePasswordForUser(currentUser.userId, userId, password);
	}

	@Patch('me/password')
	@ApiOperation({ summary: 'Updates the the temporary account password for the authenticated user.' })
	@ApiResponse({ status: 200, description: 'Updated the temporary password successfully.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 401, type: UnauthorizedError, description: 'No JWT provided.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'Invalid password.' })
	@ApiResponse({ status: 404, type: EntityNotFoundError, description: 'Account or user not found.' })
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
