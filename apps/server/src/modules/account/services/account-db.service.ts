import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import { AccountEntity } from '@shared/domain/entity';
import { Counted, EntityId } from '@shared/domain/types';
import bcrypt from 'bcryptjs';
import { AccountEntityToDoMapper } from '../mapper';
import { AccountRepo } from '../repo/account.repo';
import { AccountLookupService } from './account-lookup.service';
import { AbstractAccountService } from './account.service.abstract';
import { Account } from '../domain';

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

	async save(accountDto: Account): Promise<Account> {
		let account: AccountEntity;
		// HINT: mapping could be done by a mapper (though this whole file is subject to be removed in the future)
		// HINT: today we have logic to map back into unit work in the baseDO
		if (accountDto.id) {
			const internalId = await this.getInternalId(accountDto.id);
			account = await this.accountRepo.findById(internalId);
			account.userId = new ObjectId(accountDto.userId);
			account.systemId = accountDto.systemId ? new ObjectId(accountDto.systemId) : undefined;
			account.username = accountDto.username;
			account.activated = accountDto.activated;
			account.expiresAt = accountDto.expiresAt;
			account.lasttriedFailedLogin = accountDto.lasttriedFailedLogin;
			if (accountDto.password) {
				account.password = await this.encryptPassword(accountDto.password);
			}
			account.credentialHash = accountDto.credentialHash;
			account.token = accountDto.token;

			await this.accountRepo.save(account);
		} else {
			account = new AccountEntity({
				userId: new ObjectId(accountDto.userId),
				systemId: accountDto.systemId ? new ObjectId(accountDto.systemId) : undefined,
				username: accountDto.username,
				activated: accountDto.activated,
				expiresAt: accountDto.expiresAt,
				lasttriedFailedLogin: accountDto.lasttriedFailedLogin,
				password: accountDto.password ? await this.encryptPassword(accountDto.password) : undefined,
				token: accountDto.token,
				credentialHash: accountDto.credentialHash,
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
