import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import { Counted, EntityId, IAccount, IAccountUpdate } from '@shared/domain';
import { IdentityManagementOauthService, IdentityManagementService } from '@shared/infra/identity-management';
import { AccountIdmToDtoMapper } from '../mapper';
import { AccountLookupService } from './account-lookup.service';
import { AbstractAccountService } from './account.service.abstract';
import { AccountDto, AccountSaveDto } from './dto';

@Injectable()
export class AccountServiceIdm extends AbstractAccountService {
	constructor(
		private readonly identityManager: IdentityManagementService,
		private readonly accountIdmToDtoMapper: AccountIdmToDtoMapper,
		private readonly accountLookupService: AccountLookupService,
		private readonly idmOauthService: IdentityManagementOauthService
	) {
		super();
	}

	async findById(id: EntityId): Promise<AccountDto> {
		const result = await this.identityManager.findAccountById(id);
		const account = this.accountIdmToDtoMapper.mapToDto(result);
		return account;
	}

	// TODO: this needs a better solution. probably needs followup meeting to come up with something
	async findMultipleByUserId(userIds: EntityId[]): Promise<AccountDto[]> {
		const results = new Array<IAccount>();
		for (const userId of userIds) {
			try {
				// eslint-disable-next-line no-await-in-loop
				results.push(await this.identityManager.findAccountByFctIntId(userId));
			} catch {
				// TODO: dont simply forget errors. maybe use a filter instead?
				// ignore entry
			}
		}
		const accounts = results.map((result) => this.accountIdmToDtoMapper.mapToDto(result));
		return accounts;
	}

	async findByUserId(userId: EntityId): Promise<AccountDto | null> {
		try {
			const result = await this.identityManager.findAccountByFctIntId(userId);
			return this.accountIdmToDtoMapper.mapToDto(result);
		} catch {
			// TODO: dont simply forget errors
			return null;
		}
	}

	async findByUserIdOrFail(userId: EntityId): Promise<AccountDto> {
		try {
			// TODO: reuse code here?
			const result = await this.identityManager.findAccountByFctIntId(userId);
			return this.accountIdmToDtoMapper.mapToDto(result);
		} catch {
			throw new EntityNotFoundError(`Account with userId ${userId} not found`);
		}
	}

	async findByUsernameAndSystemId(username: string, systemId: EntityId | ObjectId): Promise<AccountDto | null> {
		const [accounts] = await this.searchByUsernameExactMatch(username);
		const account = accounts.find((tempAccount) => tempAccount.systemId === systemId) || null;
		return account;
	}

	async searchByUsernamePartialMatch(userName: string, skip: number, limit: number): Promise<Counted<AccountDto[]>> {
		const [results, total] = await this.identityManager.findAccountsByUsername(userName, { skip, limit, exact: false });
		const accounts = results.map((result) => this.accountIdmToDtoMapper.mapToDto(result));
		return [accounts, total];
	}

	async searchByUsernameExactMatch(userName: string): Promise<Counted<AccountDto[]>> {
		const [results, total] = await this.identityManager.findAccountsByUsername(userName, { exact: true });
		const accounts = results.map((result) => this.accountIdmToDtoMapper.mapToDto(result));
		return [accounts, total];
	}

	async updateLastTriedFailedLogin(accountId: EntityId, lastTriedFailedLogin: Date): Promise<AccountDto> {
		const attributeName = 'lastTriedFailedLogin';
		const id = await this.getIdmAccountId(accountId);
		await this.identityManager.setUserAttribute(id, attributeName, lastTriedFailedLogin.toISOString());
		const updatedAccount = await this.identityManager.findAccountById(id);
		return this.accountIdmToDtoMapper.mapToDto(updatedAccount);
	}

	async save(accountDto: AccountSaveDto): Promise<AccountDto> {
		let accountId: string;
		const idmAccount: IAccountUpdate = {
			username: accountDto.username,
			attRefTechnicalId: accountDto.idmReferenceId,
			attRefFunctionalIntId: accountDto.userId,
			attRefFunctionalExtId: accountDto.systemId,
		};
		// TODO: probably do some method extraction here
		if (accountDto.id) {
			let idmId: string | undefined;
			// TODO: extract into a method that hides the trycatch
			try {
				idmId = await this.getIdmAccountId(accountDto.id);
			} catch {
				// TODO: logging
				// HINT: does the method even need to throw?
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
		return this.accountIdmToDtoMapper.mapToDto(updatedAccount);
	}

	private async updateAccount(idmAccountId: string, idmAccount: IAccountUpdate, password?: string): Promise<string> {
		const updatedAccountId = await this.identityManager.updateAccount(idmAccountId, idmAccount);
		if (password) {
			await this.identityManager.updateAccountPassword(idmAccountId, password);
		}
		return updatedAccountId;
	}

	private async createAccount(idmAccount: IAccountUpdate, password?: string): Promise<string> {
		const accountId = await this.identityManager.createAccount(idmAccount, password);
		return accountId;
	}

	async updateUsername(accountRefId: EntityId, username: string): Promise<AccountDto> {
		const id = await this.getIdmAccountId(accountRefId);
		await this.identityManager.updateAccount(id, { username });
		const updatedAccount = await this.identityManager.findAccountById(id);
		return this.accountIdmToDtoMapper.mapToDto(updatedAccount);
	}

	async updatePassword(accountRefId: EntityId, password: string): Promise<AccountDto> {
		const id = await this.getIdmAccountId(accountRefId);
		await this.identityManager.updateAccountPassword(id, password);
		const updatedAccount = await this.identityManager.findAccountById(id);
		return this.accountIdmToDtoMapper.mapToDto(updatedAccount);
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
		const idmAccount = await this.identityManager.findAccountByFctIntId(userId);
		await this.identityManager.deleteAccountById(idmAccount.id);
	}

	// eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
	async findMany(_offset: number, _limit: number): Promise<AccountDto[]> {
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
