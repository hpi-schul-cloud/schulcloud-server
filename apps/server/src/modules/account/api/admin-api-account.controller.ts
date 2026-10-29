import { XApiKeyAuthentication } from '@infra/auth-guard';
import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
	AccountByIdBodyParams,
	AccountByIdParams,
	AccountResponse,
	AccountSearchListResponse,
	AccountSearchQueryParams,
} from './dto';
import { AdminApiAccountUc } from './admin-api-account.uc';

@ApiTags('Admin API Accounts')
@XApiKeyAuthentication()
@Controller('/admin/accounts')
export class AdminApiAccountController {
	constructor(private readonly uc: AdminApiAccountUc) {}

	@Get()
	@ApiOperation({ summary: 'Search accounts for internal administration.' })
	public searchAccounts(@Query() query: AccountSearchQueryParams): Promise<AccountSearchListResponse> {
		return this.uc.searchAccounts(query);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get an account for internal administration.' })
	public findAccount(@Param() params: AccountByIdParams): Promise<AccountResponse> {
		return this.uc.findAccount(params.id);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update an account for internal administration.' })
	public updateAccount(
		@Param() params: AccountByIdParams,
		@Body() body: AccountByIdBodyParams
	): Promise<AccountResponse> {
		return this.uc.updateAccount(params.id, body);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete an account for internal administration.' })
	public deleteAccount(@Param() params: AccountByIdParams): Promise<AccountResponse> {
		return this.uc.deleteAccount(params.id);
	}
}
