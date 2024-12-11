import { IdentityManagementService } from '@infra/identity-management/identity-management.service';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { EntityNotFoundError } from '@shared/common';
import { Counted, EntityId } from '@shared/domain/types';
import bcrypt from 'bcryptjs';
import { AccountConfig } from '../../account-config';
import { AccountRepo } from '../../repo/micro-orm/account.repo';
import { Account } from '../account';
import { AccountSave } from '../account-save';
import { AbstractAccountService } from './account.service.abstract';

@Injectable()
export class AccountServiceDb extends AbstractAccountService {
	constructor(
		private readonly accountRepo: AccountRepo,
		private readonly idmService: IdentityManagementService,
		private readonly configService: ConfigService<AccountConfig, true>
	) {
		super();
	}

	public async findById(id: EntityId): Promise<Account> {
		const internalId = await this.getInternalId(id);

		return this.accountRepo.findById(internalId);
	}

	public findMultipleByUserId(userIds: EntityId[]): Promise<Account[]> {
		return this.accountRepo.findMultipleByUserId(userIds);
	}

	public findByUserId(userId: EntityId): Promise<Account | null> {
		return this.accountRepo.findByUserId(userId);
	}

	public findByUserIdOrFail(userId: EntityId): Promise<Account> {
		return this.accountRepo.findByUserIdOrFail(userId);
	}

	public findByUsernameAndSystemId(username: string, systemId: EntityId | ObjectId): Promise<Account | null> {
		return this.accountRepo.findByUsernameAndSystemId(username, systemId);
	}

	public async save(accountSave: AccountSave): Promise<Account> {
		let account: Account;
		if (accountSave.id) {
			const internalId = await this.getInternalId(accountSave.id);

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
					const internalId = await this.getInternalId(accountSave.id);

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
		const internalId = await this.getInternalId(accountId);
		const account = await this.accountRepo.findById(internalId);
		account.username = username;
		await this.accountRepo.save(account);
		return account;
	}

	public async updateLastLogin(accountId: EntityId, lastLogin: Date): Promise<Account> {
		const internalId = await this.getInternalId(accountId);
		const account = await this.accountRepo.findById(internalId);
		account.lastLogin = lastLogin;
		await this.accountRepo.save(account);
		return account;
	}

	public async updateLastTriedFailedLogin(accountId: EntityId, lastTriedFailedLogin: Date): Promise<Account> {
		const internalId = await this.getInternalId(accountId);
		const account = await this.accountRepo.findById(internalId);
		account.lasttriedFailedLogin = lastTriedFailedLogin;
		await this.accountRepo.save(account);
		return account;
	}

	public async updatePassword(accountId: EntityId, password: string): Promise<Account> {
		const internalId = await this.getInternalId(accountId);
		const account = await this.accountRepo.findById(internalId);
		account.password = await this.encryptPassword(password);

		await this.accountRepo.save(account);
		return account;
	}

	public async delete(id: EntityId): Promise<void> {
		const internalId = await this.getInternalId(id);
		return this.accountRepo.deleteById(internalId);
	}

	public deleteByUserId(userId: EntityId): Promise<EntityId[]> {
		return this.accountRepo.deleteByUserId(userId);
	}

	public searchByUsernamePartialMatch(userName: string, skip: number, limit: number): Promise<Counted<Account[]>> {
		return this.accountRepo.searchByUsernamePartialMatch(userName, skip, limit);
	}

	public searchByUsernameExactMatch(userName: string): Promise<Counted<Account[]>> {
		return this.accountRepo.searchByUsernameExactMatch(userName);
	}

	public validatePassword(account: Account, comparePassword: string): Promise<boolean> {
		if (!account.password) {
			return Promise.resolve(false);
		}

		const passwordCompare = bcrypt.compare(comparePassword, account.password);

		return passwordCompare;
	}

	private async getInternalId(id: EntityId | ObjectId): Promise<ObjectId> {
		const internalId = await this.convertExternalToInternalId(id);

		return internalId;
	}

	private async convertExternalToInternalId(id: EntityId | ObjectId): Promise<ObjectId> {
		if (id instanceof ObjectId || ObjectId.isValid(id)) {
			return new ObjectId(id);
		}
		if (this.configService.get('FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED') === true) {
			const account = await this.idmService.findAccountById(id);
			return new ObjectId(account.attDbcAccountId);
		}
		throw new EntityNotFoundError(`Account with id ${id.toString()} not found`);
	}

	private encryptPassword(password: string): Promise<string> {
		return bcrypt.hash(password, 10);
	}

	public findMany(offset = 0, limit = 100): Promise<Account[]> {
		return this.accountRepo.findMany(offset, limit);
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
