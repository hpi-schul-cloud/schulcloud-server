import { Logger } from '@core/logger';
import { IdentityManagementOauthService, IdentityManagementService } from '@infra/identity-management';
import { ObjectId } from '@mikro-orm/mongodb';
import { Inject, Injectable, NotImplementedException } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common/error';
import { Counted, EntityId } from '@shared/domain/types';
import { ACCOUNT_CONFIG_TOKEN, AccountConfig } from '../../account-config';
import { Account, AccountSave, IdmAccountUpdate } from '../do';
import { FindAccountByDbcUserIdLoggable, GetOptionalIdmAccountLoggable } from '../error';
import { AccountIdmToDoMapper } from '../mapper';
import { AbstractAccountService } from './account.service.abstract';

@Injectable()
export class AccountServiceIdm extends AbstractAccountService {
	constructor(
		private readonly identityManager: IdentityManagementService,
		private readonly accountIdmToDoMapper: AccountIdmToDoMapper,
		private readonly idmOauthService: IdentityManagementOauthService,
		private readonly logger: Logger,
		@Inject(ACCOUNT_CONFIG_TOKEN) private readonly config: AccountConfig
	) {
		super();
	}

	public async findById(id: EntityId): Promise<Account> {
		const result = await this.identityManager.findAccountById(id);
		const account = this.accountIdmToDoMapper.mapToDo(result);
		return account;
	}

	public async findMultipleByUserId(userIds: EntityId[]): Promise<Account[]> {
		const resultAccounts = new Array<Account>();

		const promises = userIds.map((userId) => this.identityManager.findAccountByDbcUserId(userId).catch(() => null));
		const idmAccounts = await Promise.allSettled(promises);

		idmAccounts.forEach((idmAccount, index) => {
			if (idmAccount.status === 'fulfilled' && idmAccount.value) {
				const accountDo = this.accountIdmToDoMapper.mapToDo(idmAccount.value);
				resultAccounts.push(accountDo);
			} else {
				this.logger.warning(new FindAccountByDbcUserIdLoggable(userIds[index]));
			}
		});

		return resultAccounts;
	}

	public async findByUserId(userId: EntityId): Promise<Account | null> {
		try {
			const result = await this.identityManager.findAccountByDbcUserId(userId);
			return this.accountIdmToDoMapper.mapToDo(result);
		} catch {
			this.logger.warning(new FindAccountByDbcUserIdLoggable(userId));
			return null;
		}
	}

	public async findByUserIdOrFail(userId: EntityId): Promise<Account> {
		try {
			const result = await this.identityManager.findAccountByDbcUserId(userId);
			return this.accountIdmToDoMapper.mapToDo(result);
		} catch {
			throw new EntityNotFoundError(`Account with userId ${userId} not found`);
		}
	}

	public async findByUsernameAndSystemId(username: string, systemId: EntityId | ObjectId): Promise<Account | null> {
		const [accounts] = await this.searchByUsernameExactMatch(username);
		const account = accounts.find((tempAccount) => tempAccount.systemId === systemId) || null;
		return account;
	}

	public async searchByUsernamePartialMatch(
		userName: string,
		skip: number,
		limit: number
	): Promise<Counted<Account[]>> {
		const [results, total] = await this.identityManager.findAccountsByUsername(userName, { skip, limit, exact: false });
		const accounts = results.map((result) => this.accountIdmToDoMapper.mapToDo(result));
		return [accounts, total];
	}

	public async searchByUsernameExactMatch(userName: string): Promise<Counted<Account[]>> {
		const [results, total] = await this.identityManager.findAccountsByUsername(userName, { exact: true });
		const accounts = results.map((result) => this.accountIdmToDoMapper.mapToDo(result));
		return [accounts, total];
	}

	public async updateLastTriedFailedLogin(accountId: EntityId, lastTriedFailedLogin: Date): Promise<Account> {
		const attributeName = 'lastTriedFailedLogin';
		const id = await this.getIdmAccountId(accountId);
		await this.identityManager.setUserAttribute(id, attributeName, lastTriedFailedLogin.toISOString());
		const updatedAccount = await this.identityManager.findAccountById(id);
		return this.accountIdmToDoMapper.mapToDo(updatedAccount);
	}

	public async save(accountSave: AccountSave): Promise<Account> {
		let accountId: string;
		const idmAccount: IdmAccountUpdate = {
			username: accountSave.username,
			attDbcAccountId: accountSave.idmReferenceId,
			attDbcUserId: accountSave.userId,
			attDbcSystemId: accountSave.systemId,
		};

		if (accountSave.id) {
			const idmId = await this.getOptionalIdmAccount(accountSave.id);
			if (idmId) {
				accountId = await this.updateAccount(idmId, idmAccount, accountSave.password);
			} else {
				accountId = await this.createAccount(idmAccount, accountSave.password);
			}
		} else {
			accountId = await this.createAccount(idmAccount, accountSave.password);
		}

		const updatedAccount = await this.identityManager.findAccountById(accountId);
		return this.accountIdmToDoMapper.mapToDo(updatedAccount);
	}

	public saveAll(accountSaves: AccountSave[]): Promise<Account[]> {
		const savePromises = accountSaves.map((accountSave) => this.save(accountSave));
		const savedAccounts = Promise.all(savePromises);

		return savedAccounts;
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

	public async updateUsername(accountRefId: EntityId, username: string): Promise<Account> {
		const id = await this.getIdmAccountId(accountRefId);
		await this.identityManager.updateAccount(id, { username });
		const updatedAccount = await this.identityManager.findAccountById(id);
		return this.accountIdmToDoMapper.mapToDo(updatedAccount);
	}

	public async updatePassword(accountRefId: EntityId, password: string): Promise<Account> {
		const id = await this.getIdmAccountId(accountRefId);
		await this.identityManager.updateAccountPassword(id, password);
		const updatedAccount = await this.identityManager.findAccountById(id);
		return this.accountIdmToDoMapper.mapToDo(updatedAccount);
	}

	public async validatePassword(account: Account, comparePassword: string): Promise<boolean> {
		const jwt = await this.idmOauthService.resourceOwnerPasswordGrant(account.username, comparePassword);
		return jwt !== undefined;
	}

	public async delete(accountRefId: EntityId): Promise<void> {
		const id = await this.getIdmAccountId(accountRefId);
		await this.identityManager.deleteAccountById(id);
	}

	public async deleteByUserId(userId: EntityId): Promise<EntityId[]> {
		const idmAccount = await this.identityManager.findAccountByDbcUserId(userId);
		const deletedAccountId = await this.identityManager.deleteAccountById(idmAccount.id);

		return [deletedAccountId];
	}

	// eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
	public findMany(_offset: number, _limit: number): Promise<Account[]> {
		return Promise.reject(new NotImplementedException());
	}

	private async getOptionalIdmAccount(accountId: string): Promise<string | undefined> {
		try {
			return await this.getIdmAccountId(accountId);
		} catch {
			this.logger.debug(new GetOptionalIdmAccountLoggable(accountId));
			return undefined;
		}
	}

	private async getIdmAccountId(accountId: string): Promise<string> {
		const externalId = await this.convertInternalToExternalId(accountId);

		return externalId;
	}

	private async convertInternalToExternalId(id: EntityId | ObjectId): Promise<string> {
		if (!(id instanceof ObjectId) && !ObjectId.isValid(id)) {
			return id;
		}
		if (this.config.identityManagementStoreEnabled === true) {
			const account = await this.identityManager.findAccountByDbcAccountId(id.toString());
			return account.id;
		}
		throw new EntityNotFoundError(`Account with id ${id.toString()} not found`);
	}

	public async isUniqueEmail(email: string): Promise<boolean> {
		const [accounts] = await this.identityManager.findAccountsByUsername(email, { exact: true });
		const isUniqueEmail = accounts.length === 0;

		return isUniqueEmail;
	}
}
