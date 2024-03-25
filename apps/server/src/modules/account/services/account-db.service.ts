import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { EntityNotFoundError } from '@shared/common';
import { Counted, EntityId } from '@shared/domain/types';
import { IdentityManagementService } from '@infra/identity-management/identity-management.service';
import bcrypt from 'bcryptjs';
import { AccountConfig } from '../account-config';
import { Account, AccountSave } from '../domain/account';
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
			account.userId = accountSave.userId;
			account.systemId = accountSave.systemId;
			account.username = accountSave.username;
			account.activated = accountSave.activated;
			account.expiresAt = accountSave.expiresAt;
			account.lasttriedFailedLogin = accountSave.lasttriedFailedLogin;
			if (accountSave.password) {
				account.password = await this.encryptPassword(accountSave.password);
			}
			account.credentialHash = accountSave.credentialHash;
			account.token = accountSave.token;
		} else {
			account = new Account({
				id: new ObjectId().toHexString(),
				userId: accountSave.userId,
				systemId: accountSave.systemId,
				username: accountSave.username,
				activated: accountSave.activated,
				expiresAt: accountSave.expiresAt,
				lasttriedFailedLogin: accountSave.lasttriedFailedLogin,
				password: accountSave.password ? await this.encryptPassword(accountSave.password) : undefined,
				token: accountSave.token,
				credentialHash: accountSave.credentialHash,
			});
		}
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
		return bcrypt.compare(comparePassword, account.password); // hint: first get result, then return seperately
	}

	private async getInternalId(id: EntityId | ObjectId): Promise<ObjectId> {
		const internalId = await this.getInternalIdImpl(id);
		if (!internalId) {
			throw new EntityNotFoundError(`Account with id ${id.toString()} not found`);
		}
		return internalId;
	}

	/**
	 * Converts an external id to the internal id, if the id is already an internal id, it will be returned as is.
	 * IMPORTANT: This method will not guarantee that the id is valid, it will only try to convert it.
	 * @param id the id the should be converted to the internal id.
	 * @returns the converted id or null if conversion failed.
	 */
	private async getInternalIdImpl(id: EntityId | ObjectId): Promise<ObjectId | null> {
		if (id instanceof ObjectId || ObjectId.isValid(id)) {
			return new ObjectId(id);
		}
		if (this.configService.get('FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED') === true) {
			const account = await this.idmService.findAccountById(id);
			return new ObjectId(account.attDbcAccountId);
		}
		return null;
	}

	private encryptPassword(password: string): Promise<string> {
		return bcrypt.hash(password, 10);
	}

	async findMany(offset = 0, limit = 100): Promise<Account[]> {
		return this.accountRepo.findMany(offset, limit);
	}
}
