import { IdentityManagementService } from '@infra/identity-management';
import { ObjectId } from '@mikro-orm/mongodb';
import { Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common/error';
import { Counted, EntityId } from '@shared/domain/types';
import bcrypt from 'bcryptjs';
import { ACCOUNT_CONFIG_TOKEN, AccountConfig } from '../../account-config';
import { Account, AccountSave } from '../do';
import { ACCOUNT_REPO, AccountRepo } from '../interface';
import { AbstractAccountService } from './account.service.abstract';

@Injectable()
export class AccountServiceDb extends AbstractAccountService {
	constructor(
		@Inject(ACCOUNT_REPO) private readonly accountRepo: AccountRepo,
		private readonly idmService: IdentityManagementService,
		@Inject(ACCOUNT_CONFIG_TOKEN) private readonly config: AccountConfig
	) {
		super();
	}

	public async findById(id: EntityId): Promise<Account> {
		const internalId = await this.convertExternalToInternalId(id);

		return this.accountRepo.findById(internalId);
	}

	public findMultipleByUserId(userIds: EntityId[]): Promise<Account[]> {
		const accounts = this.accountRepo.findMultipleByUserId(userIds);

		return accounts;
	}

	public findByUserId(userId: EntityId): Promise<Account | null> {
		const account = this.accountRepo.findByUserId(userId);

		return account;
	}

	public findByUserIdOrFail(userId: EntityId): Promise<Account> {
		const account = this.accountRepo.findByUserIdOrFail(userId);

		return account;
	}

	public findByUsernameAndSystemId(username: string, systemId: EntityId | ObjectId): Promise<Account | null> {
		return this.accountRepo.findByUsernameAndSystemId(username, systemId);
	}

	public async save(accountSave: AccountSave): Promise<Account> {
		let account: Account;
		if (accountSave.id) {
			const internalId = await this.convertExternalToInternalId(accountSave.id);

			account = await this.accountRepo.findById(internalId);
		} else {
			account = this.createAccount(accountSave);
		}
		await account.update(accountSave);
		return this.accountRepo.save(account);
	}

	public async saveAll(accountSaves: AccountSave[]): Promise<Account[]> {
		const updatedAccounts = await Promise.all(
			accountSaves.map(async (accountSave) => {
				let account: Account;
				if (accountSave.id) {
					const internalId = await this.convertExternalToInternalId(accountSave.id);

					account = await this.accountRepo.findById(internalId);
				} else {
					account = this.createAccount(accountSave);
				}
				await account.update(accountSave);
				return account;
			})
		);

		const savedAccounts = this.accountRepo.saveAll(updatedAccounts);

		return savedAccounts;
	}

	public async updateUsername(accountId: EntityId, username: string): Promise<Account> {
		const internalId = await this.convertExternalToInternalId(accountId);
		const account = await this.accountRepo.findById(internalId);
		account.username = username;
		await this.accountRepo.save(account);
		return account;
	}

	public async updateLastLogin(accountId: EntityId, lastLogin: Date): Promise<Account> {
		const internalId = await this.convertExternalToInternalId(accountId);
		const account = await this.accountRepo.findById(internalId);
		account.lastLogin = lastLogin;

		const savedAccount = this.accountRepo.save(account);

		return savedAccount;
	}

	public async updateLastTriedFailedLogin(accountId: EntityId, lastTriedFailedLogin: Date): Promise<Account> {
		const internalId = await this.convertExternalToInternalId(accountId);
		const account = await this.accountRepo.findById(internalId);
		account.lasttriedFailedLogin = lastTriedFailedLogin;

		const savedAccount = this.accountRepo.save(account);

		return savedAccount;
	}

	public async updatePassword(accountId: EntityId, password: string): Promise<Account> {
		const internalId = await this.convertExternalToInternalId(accountId);
		const account = await this.accountRepo.findById(internalId);
		account.password = await this.encryptPassword(password);

		const savedAccount = this.accountRepo.save(account);

		return savedAccount;
	}

	public async delete(id: EntityId): Promise<void> {
		const internalId = await this.convertExternalToInternalId(id);
		return this.accountRepo.deleteById(internalId);
	}

	public deleteByUserId(userId: EntityId): Promise<EntityId[]> {
		const entityId = this.accountRepo.deleteByUserId(userId);
		return entityId;
	}

	public searchByUsernamePartialMatch(userName: string, skip: number, limit: number): Promise<Counted<Account[]>> {
		const accounts = this.accountRepo.searchByUsernamePartialMatch(userName, skip, limit);
		return accounts;
	}

	public searchByUsernameExactMatch(userName: string): Promise<Counted<Account[]>> {
		const accounts = this.accountRepo.searchByUsernameExactMatch(userName);
		return accounts;
	}

	public validatePassword(account: Account, comparePassword: string): Promise<boolean> {
		if (!account.password) {
			return Promise.resolve(false);
		}

		const passwordCompare = bcrypt.compare(comparePassword, account.password);

		return passwordCompare;
	}

	private async convertExternalToInternalId(id: EntityId | ObjectId): Promise<ObjectId> {
		if (id instanceof ObjectId || ObjectId.isValid(id)) {
			return new ObjectId(id);
		}
		if (this.config.identityManagementStoreEnabled === true) {
			const account = await this.idmService.findAccountById(id);
			return new ObjectId(account.attDbcAccountId);
		}
		throw new EntityNotFoundError(`Account with id ${id.toString()} not found`);
	}

	private encryptPassword(password: string): Promise<string> {
		return bcrypt.hash(password, 10);
	}

	public findMany(offset = 0, limit = 100): Promise<Account[]> {
		const accounts = this.accountRepo.findMany(offset, limit);
		return accounts;
	}

	private createAccount(accountSave: AccountSave): Account {
		if (!accountSave.username) {
			throw new Error('Username is required');
		}

		const account = new Account({
			id: new ObjectId().toHexString(),
			username: accountSave.username,
		});

		return account;
	}

	public async isUniqueEmail(email: string): Promise<boolean> {
		const account = await this.accountRepo.findByUsername(email);
		const isUnique = !account;

		return isUnique;
	}
}
