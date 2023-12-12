import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import { Account } from '@shared/domain/entity';
import { Counted, EntityId } from '@shared/domain/types';
import bcrypt from 'bcryptjs';
import { IdentityManagementService } from '@src/infra/identity-management';
import { ConfigService } from '@nestjs/config';
import { AccountEntityToDtoMapper } from '../mapper';
import { AccountRepo } from '../repo/account.repo';
import { AbstractAccountService } from './account.service.abstract';
import { AccountDto, AccountSaveDto } from './dto';
import { AccountConfig } from '../account-config';

@Injectable()
export class AccountServiceDb extends AbstractAccountService {
	constructor(
		private readonly accountRepo: AccountRepo,
		private readonly idmService: IdentityManagementService,
		private readonly configService: ConfigService<AccountConfig, true>
	) {
		super();
	}

	async findById(id: EntityId): Promise<AccountDto> {
		const internalId = await this.getInternalId(id);
		const accountEntity = await this.accountRepo.findById(internalId);

		return AccountEntityToDtoMapper.mapToDto(accountEntity);
	}

	async findMultipleByUserId(userIds: EntityId[]): Promise<AccountDto[]> {
		const accountEntities = await this.accountRepo.findMultipleByUserId(userIds);

		return AccountEntityToDtoMapper.mapAccountsToDto(accountEntities);
	}

	async findByUserId(userId: EntityId): Promise<AccountDto | null> {
		const accountEntity = await this.accountRepo.findByUserId(userId);

		return accountEntity ? AccountEntityToDtoMapper.mapToDto(accountEntity) : null;
	}

	async findByUserIdOrFail(userId: EntityId): Promise<AccountDto> {
		const accountEntity = await this.accountRepo.findByUserId(userId);
		if (!accountEntity) {
			throw new EntityNotFoundError('Account');
		}

		return AccountEntityToDtoMapper.mapToDto(accountEntity);
	}

	async findByUsernameAndSystemId(username: string, systemId: EntityId | ObjectId): Promise<AccountDto | null> {
		const accountEntity = await this.accountRepo.findByUsernameAndSystemId(username, systemId);

		return accountEntity ? AccountEntityToDtoMapper.mapToDto(accountEntity) : null;
	}

	async save(accountDto: AccountSaveDto): Promise<AccountDto> {
		let account: Account;
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
			account = new Account({
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

			await this.accountRepo.save(account);
		}

		return AccountEntityToDtoMapper.mapToDto(account);
	}

	async updateUsername(accountId: EntityId, username: string): Promise<AccountDto> {
		const internalId = await this.getInternalId(accountId);
		const account = await this.accountRepo.findById(internalId);
		account.username = username;
		await this.accountRepo.save(account);

		return AccountEntityToDtoMapper.mapToDto(account);
	}

	async updateLastTriedFailedLogin(accountId: EntityId, lastTriedFailedLogin: Date): Promise<AccountDto> {
		const internalId = await this.getInternalId(accountId);
		const account = await this.accountRepo.findById(internalId);
		account.lasttriedFailedLogin = lastTriedFailedLogin;
		await this.accountRepo.save(account);

		return AccountEntityToDtoMapper.mapToDto(account);
	}

	async updatePassword(accountId: EntityId, password: string): Promise<AccountDto> {
		const internalId = await this.getInternalId(accountId);
		const account = await this.accountRepo.findById(internalId);
		account.password = await this.encryptPassword(password);

		await this.accountRepo.save(account);

		return AccountEntityToDtoMapper.mapToDto(account);
	}

	async delete(id: EntityId): Promise<void> {
		const internalId = await this.getInternalId(id);

		return this.accountRepo.deleteById(internalId);
	}

	async deleteByUserId(userId: EntityId): Promise<void> {
		return this.accountRepo.deleteByUserId(userId);
	}

	async searchByUsernamePartialMatch(userName: string, skip: number, limit: number): Promise<Counted<AccountDto[]>> {
		const accountEntities = await this.accountRepo.searchByUsernamePartialMatch(userName, skip, limit);

		return AccountEntityToDtoMapper.mapSearchResult(accountEntities);
	}

	async searchByUsernameExactMatch(userName: string): Promise<Counted<AccountDto[]>> {
		const accountEntities = await this.accountRepo.searchByUsernameExactMatch(userName);

		return AccountEntityToDtoMapper.mapSearchResult(accountEntities);
	}

	validatePassword(account: AccountDto, comparePassword: string): Promise<boolean> {
		if (!account.password) {
			return Promise.resolve(false);
		}

		return bcrypt.compare(comparePassword, account.password);
	}
	/*
	private async getInternalId2(id: EntityId | ObjectId): Promise<ObjectId | null> {
		if (id instanceof ObjectId || ObjectId.isValid(id)) {
			return new ObjectId(id);
		}
		if (this.configService.get('FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED') === true) {
			const account = await this.idmService.findAccountById(id);
			return new ObjectId(account.attDbcAccountId);
		}
		return null;
	}

	private async getInternalId(id: EntityId | ObjectId): Promise<ObjectId> {
		const internalId = await this.getInternalId2(id);
		if (!internalId) {
			throw new EntityNotFoundError(`Account with id ${id.toString()} not found`);
		}

		return internalId;
	}
	*/

	private async getInternalId(id: EntityId): Promise<ObjectId> {
		const isEnabled = this.configService.get('FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED') === true;
		const isValidObjectId = ObjectId.isValid(id);

		if (!isValidObjectId || !isEnabled) {
			throw new EntityNotFoundError(`Account with id ${id.toString()} not found`);
		}

		const account = await this.idmService.findAccountById(id);
		return new ObjectId(account.attDbcAccountId);
	}

	private encryptPassword(password: string): Promise<string> {
		return bcrypt.hash(password, 10);
	}

	async findMany(offset = 0, limit = 100): Promise<AccountDto[]> {
		const accounts = await this.accountRepo.findMany(offset, limit);

		return AccountEntityToDtoMapper.mapAccountsToDto(accounts);
	}
}
