import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import { Counted, EntityId, IAccount, IAccountUpdate } from '@shared/domain';
import { IdentityManagementService } from '@shared/infra/identity-management/identity-management.service';
import { AccountIdmToDtoMapper } from '../mapper';
import { AbstractAccountService } from './account.service.abstract';
import { AccountDto, AccountSaveDto } from './dto';
import { AccountLookupService } from './account-lookup.service';

@Injectable()
export class AccountServiceIdm extends AbstractAccountService {
	constructor(
		private readonly identityManager: IdentityManagementService,
		private readonly accountIdmToDtoMapper: AccountIdmToDtoMapper,
		private readonly accountLookupService: AccountLookupService
	) {
		super();
	}

	async findById(id: EntityId): Promise<AccountDto> {
		const result = await this.identityManager.findAccountById(id);
		const account = this.accountIdmToDtoMapper.mapToDto(result);
		return account;
	}

	async findMultipleByUserId(userIds: EntityId[]): Promise<AccountDto[]> {
		const results = new Array<IAccount>();
		for (const userId of userIds) {
			// eslint-disable-next-line no-await-in-loop
			const result = await this.identityManager.findAccountByFctIntId(userId);
			if (result) {
				results.push(result);
			}
		}
		const accounts = results.map((result) => this.accountIdmToDtoMapper.mapToDto(result));
		return accounts;
	}

	async findByUserId(userId: EntityId): Promise<AccountDto | null> {
		const result = await this.identityManager.findAccountByFctIntId(userId);
		const account = result ? this.accountIdmToDtoMapper.mapToDto(result) : null;
		return account;
	}

	async findByUserIdOrFail(userId: EntityId): Promise<AccountDto> {
		const result = await this.identityManager.findAccountByFctIntId(userId);
		if (!result) {
			throw new EntityNotFoundError(`Account with userId ${userId} not found`);
		}
		const account = this.accountIdmToDtoMapper.mapToDto(result);
		return account;
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
		if (accountDto.id) {
			try {
				const idmId = await this.getIdmAccountId(accountDto.id);
				accountId = await this.updateAccount(idmId, idmAccount, accountDto.password);
			} catch {
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

	async delete(accountRefId: EntityId): Promise<void> {
		const id = await this.getIdmAccountId(accountRefId);
		await this.identityManager.deleteAccountById(id);
	}

	async deleteByUserId(userId: EntityId): Promise<void> {
		const idmAccount = await this.identityManager.findAccountByFctIntId(userId);
		await this.identityManager.deleteAccountById(idmAccount.id);
	}

	private async getIdmAccountId(accountId: string): Promise<string> {
		const externalId = await this.accountLookupService.getExternalId(accountId);
		if (!externalId) {
			throw new EntityNotFoundError(`Account with id ${accountId} not found`);
		}
		return externalId;
	}
}
