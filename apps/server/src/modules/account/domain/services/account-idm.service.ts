import { IdentityManagementOauthService, IdentityManagementService } from '@infra/identity-management';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { EntityNotFoundError } from '@shared/common';
import { IdmAccountUpdate } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { Account, AccountSave } from '..';
import { AccountConfig } from '../../account-config';
import { AccountIdmToDoMapper } from '../../repo/micro-orm/mapper';
import { FindAccountByDbcUserIdLoggable, GetOptionalIdmAccountLoggable } from '../error';
import { AbstractAccountService } from './account.service.abstract';

@Injectable()
export class AccountServiceIdm extends AbstractAccountService {
	constructor(
		private readonly identityManager: IdentityManagementService,
		private readonly accountIdmToDoMapper: AccountIdmToDoMapper,
		private readonly idmOauthService: IdentityManagementOauthService,
		private readonly logger: Logger,
		private readonly configService: ConfigService<AccountConfig, true>
	) {
		super();
	}

	async findById(id: EntityId): Promise<Account> {
		const result = await this.identityManager.findAccountById(id);
		const account = this.accountIdmToDoMapper.mapToDo(result);
		return account;
	}

	async findMultipleByUserId(userIds: EntityId[]): Promise<Account[]> {
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

	async findByUserId(userId: EntityId): Promise<Account | null> {
		try {
			const result = await this.identityManager.findAccountByDbcUserId(userId);
			return this.accountIdmToDoMapper.mapToDo(result);
		} catch {
			this.logger.warning(new FindAccountByDbcUserIdLoggable(userId));
			return null;
		}
	}

	async findByUserIdOrFail(userId: EntityId): Promise<Account> {
		try {
			const result = await this.identityManager.findAccountByDbcUserId(userId);
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
		const accounts = results.map((result) => this.accountIdmToDoMapper.mapToDo(result));
		return [accounts, total];
	}

	async searchByUsernameExactMatch(userName: string): Promise<Counted<Account[]>> {
		const [results, total] = await this.identityManager.findAccountsByUsername(userName, { exact: true });
		const accounts = results.map((result) => this.accountIdmToDoMapper.mapToDo(result));
		return [accounts, total];
	}

	async updateLastLogin(accountId: EntityId, lastLogin: Date): Promise<Account> {
		const attributeName = 'lastLogin';
		const id = await this.getIdmAccountId(accountId);
		await this.identityManager.setUserAttribute(id, attributeName, lastLogin.toISOString());
		const updatedAccount = await this.identityManager.findAccountById(id);
		return this.accountIdmToDoMapper.mapToDo(updatedAccount);
	}

	async updateLastTriedFailedLogin(accountId: EntityId, lastTriedFailedLogin: Date): Promise<Account> {
		const attributeName = 'lastTriedFailedLogin';
		const id = await this.getIdmAccountId(accountId);
		await this.identityManager.setUserAttribute(id, attributeName, lastTriedFailedLogin.toISOString());
		const updatedAccount = await this.identityManager.findAccountById(id);
		return this.accountIdmToDoMapper.mapToDo(updatedAccount);
	}

	async save(accountSave: AccountSave): Promise<Account> {
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
		return this.accountIdmToDoMapper.mapToDo(updatedAccount);
	}

	async updatePassword(accountRefId: EntityId, password: string): Promise<Account> {
		const id = await this.getIdmAccountId(accountRefId);
		await this.identityManager.updateAccountPassword(id, password);
		const updatedAccount = await this.identityManager.findAccountById(id);
		return this.accountIdmToDoMapper.mapToDo(updatedAccount);
	}

	async validatePassword(account: Account, comparePassword: string): Promise<boolean> {
		const jwt = await this.idmOauthService.resourceOwnerPasswordGrant(account.username, comparePassword);
		return jwt !== undefined;
	}

	async delete(accountRefId: EntityId): Promise<void> {
		const id = await this.getIdmAccountId(accountRefId);
		await this.identityManager.deleteAccountById(id);
	}

	async deleteByUserId(userId: EntityId): Promise<EntityId[]> {
		const idmAccount = await this.identityManager.findAccountByDbcUserId(userId);
		const deletedAccountId = await this.identityManager.deleteAccountById(idmAccount.id);

		return [deletedAccountId];
	}

	// eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
	async findMany(_offset: number, _limit: number): Promise<Account[]> {
		throw new NotImplementedException();
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
		if (this.configService.get('FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED') === true) {
			const account = await this.identityManager.findAccountByDbcAccountId(id.toString());
			return account.id;
		}
		throw new EntityNotFoundError(`Account with id ${id.toString()} not found`);
	}
}
