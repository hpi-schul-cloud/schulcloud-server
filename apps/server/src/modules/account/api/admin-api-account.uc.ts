import { AccountService, UpdateAccount } from '@modules/account';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common/error';
import type { Account } from '../domain';
import { AccountSearchType } from '../domain/type/account-search-type';
import { AccountByIdBodyParams, AccountResponse, AccountSearchListResponse, AccountSearchQueryParams } from './dto';
import { AccountResponseMapper } from './mapper/account-response.mapper';
import { AccountUcMapper } from './mapper/account-uc.mapper';

@Injectable()
export class AdminApiAccountUc {
	constructor(
		private readonly accountService: AccountService,
		private readonly userService: UserService
	) {}

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

	public async updateAccount(accountId: string, body: AccountByIdBodyParams): Promise<AccountResponse> {
		const account = await this.accountService.findById(accountId);
		if (!account.userId) {
			throw new EntityNotFoundError('User');
		}
		const user = await this.userService.getUserEntityWithRoles(account.userId);
		const updated = await this.accountService.updateAccount(user, account, new UpdateAccount(body));
		return AccountResponseMapper.mapToAccountResponse(AccountUcMapper.mapToResolvedAccountDto(updated));
	}

	public async deleteAccount(accountId: string): Promise<AccountResponse> {
		const account = await this.accountService.findById(accountId);
		const response = AccountResponseMapper.mapToAccountResponse(AccountUcMapper.mapToResolvedAccountDto(account));
		await this.accountService.delete(accountId);
		return response;
	}
}
