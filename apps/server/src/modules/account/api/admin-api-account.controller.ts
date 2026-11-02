import { XApiKeyAuthentication } from '@infra/auth-guard';
import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccountByIdParams, AccountResponse, AccountSearchListResponse, AccountSearchQueryParams } from './dto';
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

	@Delete(':id')
	@ApiOperation({ summary: 'Delete an account for internal administration.' })
	public deleteAccount(@Param() params: AccountByIdParams): Promise<AccountResponse> {
		return this.uc.deleteAccount(params.id);
	}
}
