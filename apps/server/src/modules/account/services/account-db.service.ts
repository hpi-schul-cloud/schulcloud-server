import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import { AccountEntity } from '@shared/domain/entity';
import { Counted, EntityId } from '@shared/domain/types';
import bcrypt from 'bcryptjs';
import { Account } from '../domain/account';
import { AccountRepo } from '../repo/account.repo';
import { AccountEntityToDoMapper } from '../repo/mapper';
import { AccountLookupService } from './account-lookup.service';

@Injectable()
export class AccountServiceDb {
	constructor(private readonly accountRepo: AccountRepo, private readonly accountLookupService: AccountLookupService) {}

	async findById(id: EntityId): Promise<Account> {
		const internalId = await this.getInternalId(id);
		const accountEntity = await this.accountRepo.findById(internalId);
		return AccountEntityToDoMapper.mapToDo(accountEntity);
	}

	async findMultipleByUserId(userIds: EntityId[]): Promise<Account[]> {
		const account = await this.accountRepo.findMultipleByUserId(userIds);
		return account;
	}

	async findByUserId(userId: EntityId): Promise<Account | null> {
		const account = await this.accountRepo.findByUserId(userId);
		return account;
	}

	async findByUserIdOrFail(userId: EntityId): Promise<Account> {
		const account = await this.accountRepo.findByUserId(userId);
		if (!account) {
			throw new EntityNotFoundError('Account');
		}
		return account;
	}

	async findByUsernameAndSystemId(username: string, systemId: EntityId | ObjectId): Promise<Account | null> {
		const account = await this.accountRepo.findByUsernameAndSystemId(username, systemId);
		return account;
	}

	async save(account: Account): Promise<Account> {
		let accountEntity: AccountEntity;
		if (account.id) {
			const internalId = await this.getInternalId(account.id);
			accountEntity = await this.accountRepo.findById(internalId);
			accountEntity.userId = new ObjectId(account.userId);
			accountEntity.systemId = account.systemId ? new ObjectId(account.systemId) : undefined;
			accountEntity.username = account.username;
			accountEntity.activated = account.activated;
			accountEntity.expiresAt = account.expiresAt;
			accountEntity.lasttriedFailedLogin = account.lasttriedFailedLogin;
			if (account.password) {
				accountEntity.password = await this.encryptPassword(account.password);
			}
			accountEntity.credentialHash = account.credentialHash;
			accountEntity.token = account.token;

			await this.accountRepo.save(accountEntity);
		} else {
			accountEntity = new AccountEntity({
				userId: new ObjectId(account.userId),
				systemId: account.systemId ? new ObjectId(account.systemId) : undefined,
				username: account.username,
				activated: account.activated,
				expiresAt: account.expiresAt,
				lasttriedFailedLogin: account.lasttriedFailedLogin,
				password: account.password ? await this.encryptPassword(account.password) : undefined,
				token: account.token,
				credentialHash: account.credentialHash,
			});

			await this.accountRepo.save(accountEntity);
		}
		return AccountEntityToDoMapper.mapToDo(accountEntity);
	}

	async updateUsername(accountId: EntityId, username: string): Promise<Account> {
		const internalId = await this.getInternalId(accountId);
		const account = await this.accountRepo.findById(internalId);
		account.username = username;
		await this.accountRepo.save(account);
		return AccountEntityToDoMapper.mapToDo(account);
	}

	async updateLastTriedFailedLogin(accountId: EntityId, lastTriedFailedLogin: Date): Promise<Account> {
		const internalId = await this.getInternalId(accountId);
		const account = await this.accountRepo.findById(internalId);
		account.lasttriedFailedLogin = lastTriedFailedLogin;
		await this.accountRepo.save(account);
		return AccountEntityToDoMapper.mapToDo(account);
	}

	async updatePassword(accountId: EntityId, password: string): Promise<Account> {
		const internalId = await this.getInternalId(accountId);
		const account = await this.accountRepo.findById(internalId);
		account.password = await this.encryptPassword(password);

		await this.accountRepo.save(account);
		return AccountEntityToDoMapper.mapToDo(account);
	}

	async delete(id: EntityId): Promise<void> {
		const internalId = await this.getInternalId(id);
		return this.accountRepo.deleteById(internalId);
	}

	async deleteByUserId(userId: EntityId): Promise<void> {
		return this.accountRepo.deleteByUserId(userId);
	}

	async searchByUsernamePartialMatch(userName: string, skip: number, limit: number): Promise<Counted<Account[]>> {
		const accountEntities = await this.accountRepo.searchByUsernamePartialMatch(userName, skip, limit);
		return AccountEntityToDoMapper.mapSearchResult(accountEntities);
	}

	async searchByUsernameExactMatch(userName: string): Promise<Counted<Account[]>> {
		const accountEntities = await this.accountRepo.searchByUsernameExactMatch(userName);
		return AccountEntityToDoMapper.mapSearchResult(accountEntities);
	}

	validatePassword(account: Account, comparePassword: string): Promise<boolean> {
		if (!account.password) {
			return Promise.resolve(false);
		}
		const result = bcrypt.compare(comparePassword, account.password);
		return result;
	}

	private async getInternalId(id: EntityId | ObjectId): Promise<ObjectId> {
		const internalId = await this.accountLookupService.getInternalId(id);
		if (!internalId) {
			throw new EntityNotFoundError(`Account with id ${id.toString()} not found`);
		}
		return internalId;
	}

	private encryptPassword(password: string): Promise<string> {
		return bcrypt.hash(password, 10);
	}

	async findMany(offset = 0, limit = 100): Promise<Account[]> {
		return AccountEntityToDoMapper.mapAccountsToDo(await this.accountRepo.findMany(offset, limit));
	}
}
