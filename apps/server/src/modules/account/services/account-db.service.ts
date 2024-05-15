import { IdentityManagementService } from '@infra/identity-management/identity-management.service';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { EntityNotFoundError } from '@shared/common';
import { Counted, EntityId } from '@shared/domain/types';
import bcrypt from 'bcryptjs';
import { AccountConfig } from '../account-config';
import { Account, AccountSave } from '../domain';
import { AccountRepo } from '../repo/account.repo';

@Injectable()
export class AccountServiceDb {
	constructor(
		private readonly accountRepo: AccountRepo,
		private readonly idmService: IdentityManagementService,
		private readonly configService: ConfigService<AccountConfig, true>
	) {}

	async findById(id: EntityId): Promise<Account> {
		const internalId = await this.getInternalId(id);

		return this.accountRepo.findById(internalId);
	}

	async findMultipleByUserId(userIds: EntityId[]): Promise<Account[]> {
		return this.accountRepo.findMultipleByUserId(userIds);
	}

	async findByUserId(userId: EntityId): Promise<Account | null> {
		return this.accountRepo.findByUserId(userId);
	}

	async findByUserIdOrFail(userId: EntityId): Promise<Account> {
		return this.accountRepo.findByUserIdOrFail(userId);
	}

	async findByUsernameAndSystemId(username: string, systemId: EntityId | ObjectId): Promise<Account | null> {
		return this.accountRepo.findByUsernameAndSystemId(username, systemId);
	}

	async save(accountSave: AccountSave): Promise<Account> {
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

	async updateUsername(accountId: EntityId, username: string): Promise<Account> {
		const internalId = await this.getInternalId(accountId);
		const account = await this.accountRepo.findById(internalId);
		account.username = username;
		await this.accountRepo.save(account);
		return account;
	}

	async updateLastTriedFailedLogin(accountId: EntityId, lastTriedFailedLogin: Date): Promise<Account> {
		const internalId = await this.getInternalId(accountId);
		const account = await this.accountRepo.findById(internalId);
		account.lasttriedFailedLogin = lastTriedFailedLogin;
		await this.accountRepo.save(account);
		return account;
	}

	async updatePassword(accountId: EntityId, password: string): Promise<Account> {
		const internalId = await this.getInternalId(accountId);
		const account = await this.accountRepo.findById(internalId);
		account.password = await this.encryptPassword(password);

		await this.accountRepo.save(account);
		return account;
	}

	async delete(id: EntityId): Promise<void> {
		const internalId = await this.getInternalId(id);
		return this.accountRepo.deleteById(internalId);
	}

	async deleteByUserId(userId: EntityId): Promise<EntityId[]> {
		return this.accountRepo.deleteByUserId(userId);
	}

	async searchByUsernamePartialMatch(userName: string, skip: number, limit: number): Promise<Counted<Account[]>> {
		return this.accountRepo.searchByUsernamePartialMatch(userName, skip, limit);
	}

	async searchByUsernameExactMatch(userName: string): Promise<Counted<Account[]>> {
		return this.accountRepo.searchByUsernameExactMatch(userName);
	}

	validatePassword(account: Account, comparePassword: string): Promise<boolean> {
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

	async findMany(offset = 0, limit = 100): Promise<Account[]> {
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
}
