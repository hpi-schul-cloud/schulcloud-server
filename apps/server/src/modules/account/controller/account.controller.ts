import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EntityNotFoundError, ForbiddenOperationError, ValidationError } from '@shared/common';
import { ICurrentUser, Authenticate, CurrentUser } from '@modules/authentication';
import { AccountUc } from '../uc/account.uc';
import { AccountSearchDto } from '../uc/dto/account-search.dto';
import { UpdateAccountDto } from '../uc/dto/update-account.dto';
import { UpdateMyAccountDto } from '../uc/dto/update-my-account.dto';
import {
	AccountByIdBodyParams,
	AccountByIdParams,
	AccountResponse,
	AccountSearchListResponse,
	AccountSearchQueryParams,
	PatchMyAccountParams,
	PatchMyPasswordParams,
} from './dto';
import { AccountResponseMapper } from './mapper/account-response.mapper';

@ApiTags('Account')
@Authenticate('jwt')
@Controller('account')
export class AccountController {
	constructor(private readonly accountUc: AccountUc) {}

	@Get()
	@ApiOperation({
		summary:
			'Returns all accounts which satisfies the given criteria. For unlimited access Superhero role is REQUIRED.',
	})
	@ApiResponse({ status: 200, type: AccountSearchListResponse, description: 'Returns a paged list of accounts.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'User is not a superhero or administrator.' })
	async searchAccounts(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() query: AccountSearchQueryParams
	): Promise<AccountSearchListResponse> {
		const search = new AccountSearchDto(query);
		const searchResult = await this.accountUc.searchAccounts(currentUser, search);

		return AccountResponseMapper.mapToAccountSearchListResponse(searchResult);
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
		const dto = await this.accountUc.findAccountById(currentUser, params.id);
		return AccountResponseMapper.mapToAccountResponse(dto);
	}

	// IMPORTANT!!!
	// updateMyAccount has to occur before updateAccountById, because Nest.js
	// will always use the first path match and me will be treated as a path parameter
	@Patch('me')
	@ApiOperation({ summary: 'Updates an account for the authenticated user.' })
	@ApiResponse({ status: 200, description: 'Account was successfully updated.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'Invalid password.' })
	@ApiResponse({ status: 404, type: EntityNotFoundError, description: 'Account not found.' })
	async updateMyAccount(@CurrentUser() currentUser: ICurrentUser, @Body() params: PatchMyAccountParams): Promise<void> {
		const updateData = new UpdateMyAccountDto(params);
		return this.accountUc.updateMyAccount(currentUser.userId, updateData);
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
		const updateData = new UpdateAccountDto(body);
		const dto = await this.accountUc.updateAccountById(currentUser, params.id, updateData);

		return AccountResponseMapper.mapToAccountResponse(dto);
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
		const dto = await this.accountUc.deleteAccountById(currentUser, params.id);
		return AccountResponseMapper.mapToAccountResponse(dto);
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
