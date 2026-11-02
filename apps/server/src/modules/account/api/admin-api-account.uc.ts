import { AccountService } from '@modules/account';
import { Injectable } from '@nestjs/common';
import type { Account } from '../domain';
import { AccountSearchType } from '../domain/type/account-search-type';
import { AccountResponse, AccountSearchListResponse, AccountSearchQueryParams } from './dto';
import { AccountResponseMapper } from './mapper/account-response.mapper';
import { AccountUcMapper } from './mapper/account-uc.mapper';

@Injectable()
export class AdminApiAccountUc {
	constructor(private readonly accountService: AccountService) {}

	public async searchAccounts(query: AccountSearchQueryParams): Promise<AccountSearchListResponse> {
		const skip = query.skip ?? 0;
		const limit = query.limit ?? 10;
		let accounts: Account[];
		let total: number;

		if (query.type === AccountSearchType.USERNAME) {
			[accounts, total] = await this.accountService.searchByUsernamePartialMatch(query.value, skip, limit);
		} else {
			const account = await this.accountService.findByUserId(query.value);
			accounts = account ? [account] : [];
			total = accounts.length;
		}

		const resolved = AccountUcMapper.mapAccountsToDo(accounts);
		const responses = resolved.map((account) => AccountResponseMapper.mapToAccountResponse(account));
		return new AccountSearchListResponse(responses, total, skip, limit);
	}

	public async findAccount(accountId: string): Promise<AccountResponse> {
		const account = await this.accountService.findById(accountId);
		return AccountResponseMapper.mapToAccountResponse(AccountUcMapper.mapToResolvedAccountDto(account));
	}

	public async deleteAccount(accountId: string): Promise<AccountResponse> {
		const account = await this.accountService.findById(accountId);
		const response = AccountResponseMapper.mapToAccountResponse(AccountUcMapper.mapToResolvedAccountDto(account));
		await this.accountService.delete(accountId);
		return response;
	}
}
