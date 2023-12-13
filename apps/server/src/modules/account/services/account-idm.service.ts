import { IdentityManagementOauthService, IdentityManagementService } from '@infra/identity-management';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import { IdmAccount, IdmAccountUpdate } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';
import { AccountIdmToDoMapper } from '../repo/mapper';
import { AccountDto, AccountSaveDto } from './dto';
import { AccountLookupService } from './account-lookup.service';
import { Account } from '../domain/account';

@Injectable()
export class AccountServiceIdm {
	constructor(
		private readonly identityManager: IdentityManagementService,
		private readonly accountIdmToDoMapper: AccountIdmToDoMapper,
		private readonly accountLookupService: AccountLookupService,
		private readonly idmOauthService: IdentityManagementOauthService,
		private readonly logger: LegacyLogger
	) {}

	async findById(id: EntityId): Promise<Account> {
		const result: IdmAccount = await this.identityManager.findAccountById(id);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		const account: Account = this.accountIdmToDoMapper.mapToDo(result);
		return account;
	}

	async findMultipleByUserId(userIds: EntityId[]): Promise<Account[]> {
		const results = new Array<IdmAccount>();
		for (const userId of userIds) {
			try {
				// eslint-disable-next-line no-await-in-loop
				results.push(await this.identityManager.findAccountByDbcUserId(userId));
			} catch {
				// ignore entry
			}
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		const accounts: Account[] = results.map((result) => this.accountIdmToDoMapper.mapToDo(result));
		return accounts;
	}

	async findByUserId(userId: EntityId): Promise<Account | null> {
		try {
			const result = await this.identityManager.findAccountByDbcUserId(userId);
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			return this.accountIdmToDoMapper.mapToDo(result);
		} catch {
			return null;
		}
	}

	async findByUserIdOrFail(userId: EntityId): Promise<Account> {
		try {
			const result = await this.identityManager.findAccountByDbcUserId(userId);
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			return this.accountIdmToDoMapper.mapToDo(result);
		} catch {
			throw new EntityNotFoundError(`Account with userId ${userId} not found`);
		}
	}

	async findByUsernameAndSystemId(username: string, systemId: EntityId | ObjectId): Promise<Account | null> {
		const [accounts] = await this.searchByUsernameExactMatch(username);
		const account = accounts.find((tempAccount) => tempAccount.systemId === systemId) || null;
		return account;
	}

	async searchByUsernamePartialMatch(userName: string, skip: number, limit: number): Promise<Counted<Account[]>> {
		const [results, total] = await this.identityManager.findAccountsByUsername(userName, { skip, limit, exact: false });
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		const accounts = results.map((result) => this.accountIdmToDoMapper.mapToDo(result));
		return [accounts, total];
	}

	async searchByUsernameExactMatch(userName: string): Promise<Counted<Account[]>> {
		const [results, total] = await this.identityManager.findAccountsByUsername(userName, { exact: true });
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		const accounts = results.map((result) => this.accountIdmToDoMapper.mapToDo(result));
		return [accounts, total];
	}

	async updateLastTriedFailedLogin(accountId: EntityId, lastTriedFailedLogin: Date): Promise<Account> {
		const attributeName = 'lastTriedFailedLogin';
		const id = await this.getIdmAccountId(accountId);
		await this.identityManager.setUserAttribute(id, attributeName, lastTriedFailedLogin.toISOString());
		const updatedAccount = await this.identityManager.findAccountById(id);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		const account: Account = this.accountIdmToDoMapper.mapToDo(updatedAccount);
		return account;
	}

	async save(accountDto: AccountSaveDto): Promise<Account> {
		let accountId: string;
		const idmAccount: IdmAccountUpdate = {
			username: accountDto.username,
			attDbcAccountId: accountDto.idmReferenceId,
			attDbcUserId: accountDto.userId,
			attDbcSystemId: accountDto.systemId,
		};
		if (accountDto.id) {
			let idmId: string | undefined;
			try {
				idmId = await this.getIdmAccountId(accountDto.id);
			} catch {
				this.logger.log(`Account ID ${accountDto.id} could not be resolved. Creating new account and ID ...`);
				idmId = undefined;
			}
			if (idmId) {
				accountId = await this.updateAccount(idmId, idmAccount, accountDto.password);
			} else {
				accountId = await this.createAccount(idmAccount, accountDto.password);
			}
		} else {
			accountId = await this.createAccount(idmAccount, accountDto.password);
		}

		const updatedAccount = await this.identityManager.findAccountById(accountId);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		const account: Account = this.accountIdmToDoMapper.mapToDo(updatedAccount);
		return account;
	}

	private async updateAccount(idmAccountId: string, idmAccount: IdmAccountUpdate, password?: string): Promise<string> {
		const updatedAccountId = await this.identityManager.updateAccount(idmAccountId, idmAccount);
		if (password) {
			await this.identityManager.updateAccountPassword(idmAccountId, password);
		}
		return updatedAccountId;
	}

	private async createAccount(idmAccount: IdmAccountUpdate, password?: string): Promise<string> {
		const accountId = await this.identityManager.createAccount(idmAccount, password);
		return accountId;
	}

	async updateUsername(accountRefId: EntityId, username: string): Promise<Account> {
		const id = await this.getIdmAccountId(accountRefId);
		await this.identityManager.updateAccount(id, { username });
		const updatedAccount = await this.identityManager.findAccountById(id);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		const account: Account = this.accountIdmToDoMapper.mapToDo(updatedAccount);
		return account;
	}

	async updatePassword(accountRefId: EntityId, password: string): Promise<Account> {
		const id = await this.getIdmAccountId(accountRefId);
		await this.identityManager.updateAccountPassword(id, password);
		const updatedAccount = await this.identityManager.findAccountById(id);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		const account: Account = this.accountIdmToDoMapper.mapToDo(updatedAccount);
		return account;
	}

	async validatePassword(account: AccountDto, comparePassword: string): Promise<boolean> {
		const jwt = await this.idmOauthService.resourceOwnerPasswordGrant(account.username, comparePassword);
		return jwt !== undefined;
	}

	async delete(accountRefId: EntityId): Promise<void> {
		const id = await this.getIdmAccountId(accountRefId);
		await this.identityManager.deleteAccountById(id);
	}

	async deleteByUserId(userId: EntityId): Promise<void> {
		const idmAccount = await this.identityManager.findAccountByDbcUserId(userId);
		await this.identityManager.deleteAccountById(idmAccount.id);
	}

	// eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
	async findMany(_offset: number, _limit: number): Promise<Account[]> {
		throw new NotImplementedException();
	}

	private async getIdmAccountId(accountId: string): Promise<string> {
		const externalId = await this.accountLookupService.getExternalId(accountId);
		if (!externalId) {
			throw new EntityNotFoundError(`Account with id ${accountId} not found`);
		}
		return externalId;
	}
}
