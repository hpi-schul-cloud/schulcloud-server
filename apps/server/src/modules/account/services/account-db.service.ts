import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import { Counted, EntityId } from '@shared/domain/types';
import bcrypt from 'bcryptjs';
import { AccountEntityToDoMapper } from '../repo/mapper';
import { AccountRepo } from '../repo/account.repo';
import { AccountLookupService } from './account-lookup.service';
import { AbstractAccountService } from './account.service.abstract';
import { Account, AccountSave } from '../domain';
import { AccountEntity } from '../entity/account.entity';

// HINT: do more empty lines :)

@Injectable()
export class AccountServiceDb extends AbstractAccountService {
	constructor(private readonly accountRepo: AccountRepo, private readonly accountLookupService: AccountLookupService) {
		super();
	}

	async findById(id: EntityId): Promise<Account> {
		const internalId = await this.getInternalId(id);
		const accountEntity = await this.accountRepo.findById(internalId);
		return AccountEntityToDoMapper.mapToDto(accountEntity);
	}

	async findMultipleByUserId(userIds: EntityId[]): Promise<Account[]> {
		const accountEntities = await this.accountRepo.findMultipleByUserId(userIds);
		return AccountEntityToDoMapper.mapAccountsToDto(accountEntities);
	}

	async findByUserId(userId: EntityId): Promise<Account | null> {
		const accountEntity = await this.accountRepo.findByUserId(userId);
		return accountEntity ? AccountEntityToDoMapper.mapToDto(accountEntity) : null;
	}

	async findByUserIdOrFail(userId: EntityId): Promise<Account> {
		const accountEntity = await this.accountRepo.findByUserIdOrFail(userId);
		return AccountEntityToDoMapper.mapToDto(accountEntity);
	}

	async findByUsernameAndSystemId(username: string, systemId: EntityId | ObjectId): Promise<Account | null> {
		const accountEntity = await this.accountRepo.findByUsernameAndSystemId(username, systemId);
		return accountEntity ? AccountEntityToDoMapper.mapToDto(accountEntity) : null;
	}

	async save(accountSave: AccountSave): Promise<Account> {
		let account: AccountEntity;
		// HINT: mapping could be done by a mapper (though this whole file is subject to be removed in the future)
		// HINT: today we have logic to map back into unit work in the baseDO
		if (accountSave.id) {
			const internalId = await this.getInternalId(accountSave.id);
			account = await this.accountRepo.findById(internalId);
			account.userId = new ObjectId(accountSave.userId);
			account.systemId = accountSave.systemId ? new ObjectId(accountSave.systemId) : undefined;
			account.username = accountSave.username;
			account.activated = accountSave.activated;
			account.expiresAt = accountSave.expiresAt;
			account.lasttriedFailedLogin = accountSave.lasttriedFailedLogin;
			if (accountSave.password) {
				account.password = await this.encryptPassword(accountSave.password);
			}
			account.credentialHash = accountSave.credentialHash;
			account.token = accountSave.token;

			await this.accountRepo.save(account);
		} else {
			account = new AccountEntity({
				userId: new ObjectId(accountSave.userId),
				systemId: accountSave.systemId ? new ObjectId(accountSave.systemId) : undefined,
				username: accountSave.username,
				activated: accountSave.activated,
				expiresAt: accountSave.expiresAt,
				lasttriedFailedLogin: accountSave.lasttriedFailedLogin,
				password: accountSave.password ? await this.encryptPassword(accountSave.password) : undefined,
				token: accountSave.token,
				credentialHash: accountSave.credentialHash,
			});

			await this.accountRepo.save(account); // HINT: this can be done once in the end
		}
		return AccountEntityToDoMapper.mapToDto(account);
	}

	async updateUsername(accountId: EntityId, username: string): Promise<Account> {
		const internalId = await this.getInternalId(accountId);
		const account = await this.accountRepo.findById(internalId);
		account.username = username;
		await this.accountRepo.save(account);
		return AccountEntityToDoMapper.mapToDto(account);
	}

	async updateLastTriedFailedLogin(accountId: EntityId, lastTriedFailedLogin: Date): Promise<Account> {
		const internalId = await this.getInternalId(accountId);
		const account = await this.accountRepo.findById(internalId);
		account.lasttriedFailedLogin = lastTriedFailedLogin;
		await this.accountRepo.save(account);
		return AccountEntityToDoMapper.mapToDto(account);
	}

	async updatePassword(accountId: EntityId, password: string): Promise<Account> {
		const internalId = await this.getInternalId(accountId);
		const account = await this.accountRepo.findById(internalId);
		account.password = await this.encryptPassword(password);

		await this.accountRepo.save(account);
		return AccountEntityToDoMapper.mapToDto(account);
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
		return bcrypt.compare(comparePassword, account.password); // hint: first get result, then return seperately
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
		return AccountEntityToDoMapper.mapAccountsToDto(await this.accountRepo.findMany(offset, limit));
	}
}
