import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import bcrypt from 'bcryptjs';
import { Account, EntityId } from '@shared/domain';
import { AccountRepo } from '@shared/repo';
import { IdentityManagementService } from '@shared/infra/identity-management/identity-management.service';
import { ConfigService } from '@nestjs/config';
import { IServerConfig } from '../../server/server.config';
import { Logger } from '../../../core/logger';
import { AccountEntityToDtoMapper } from '../mapper';
import { AccountDto, AccountSaveDto } from './dto';

@Injectable()
export class AccountService {
	constructor(
		private readonly accountRepo: AccountRepo,
		private readonly identityManager: IdentityManagementService,
		private readonly configService: ConfigService<IServerConfig, true>,
		private readonly logger: Logger
	) {}

	private get accountStoreEnabled(): boolean {
		return this.configService.get('FEATURE_KEYCLOAK_IDENTITY_STORE_ENABLED');
	}

	async findById(id: EntityId): Promise<AccountDto> {
		const accountEntity = await this.accountRepo.findById(id);
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
		// Check if the ID is correct?
		// const user = await this.userRepo.findById(accountDto.userId);
		// const system = accountDto.systemId ? await this.systemRepo.findById(accountDto.systemId) : undefined;
		let account: Account;
		if (accountDto.id) {
			account = await this.accountRepo.findById(accountDto.id);
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

			if (this.accountStoreEnabled) {
				try {
					const result = await this.identityManager.updateAccount(account.id, {
						email: account.username,
					});
					this.logger.log(result);
					if (account.password) {
						const foo = await this.identityManager.updateAccountPassword(account.id, account.password);
						this.logger.log(foo);
					}
				} catch (err) {
					this.logger.error(err);
					throw err;
				}
			}
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

			if (this.accountStoreEnabled) {
				try {
					const result = await this.identityManager.createAccount({
						id: account.id,
						userName: account.username,
					});
					this.logger.log(result);
				} catch (err) {
					this.logger.error(err);
					throw err;
				}
			}
		}
		return AccountEntityToDtoMapper.mapToDto(account);
	}

	async updateUsername(accountId: EntityId, username: string): Promise<AccountDto> {
		const account = await this.accountRepo.findById(accountId);
		account.username = username;
		// TODO: Check if necessary in MicroORM
		account.updatedAt = new Date();
		await this.accountRepo.save(account);

		if (this.accountStoreEnabled) {
			try {
				const result = await this.identityManager.updateAccount(accountId, { email: username });
				this.logger.log(result);
			} catch (err) {
				this.logger.error(err);
				throw err;
			}
		}

		return AccountEntityToDtoMapper.mapToDto(account);
	}

	async updateLastTriedFailedLogin(accountId: EntityId, lastTriedFailedLogin: Date): Promise<AccountDto> {
		const account = await this.accountRepo.findById(accountId);
		account.lasttriedFailedLogin = lastTriedFailedLogin;
		await this.accountRepo.save(account);
		return AccountEntityToDtoMapper.mapToDto(account);
	}

	async updatePassword(accountId: EntityId, password: string): Promise<AccountDto> {
		const account = await this.accountRepo.findById(accountId);
		account.password = await this.encryptPassword(password);
		// TODO: Check if necessary in MicroORM
		account.updatedAt = new Date();
		await this.accountRepo.save(account);

		if (this.accountStoreEnabled) {
			try {
				const result = await this.identityManager.updateAccountPassword(accountId, password);
				this.logger.log(result);
			} catch (err) {
				this.logger.error(err);
				throw err;
			}
		}

		return AccountEntityToDtoMapper.mapToDto(account);
	}

	async delete(id: EntityId): Promise<void> {
		if (this.accountStoreEnabled) {
			try {
				const result = await this.identityManager.deleteAccountById(id);
				this.logger.log(result);
			} catch (err) {
				this.logger.error(err);
				throw err;
			}
		}
		return this.accountRepo.deleteById(id);
	}

	async deleteByUserId(userId: EntityId): Promise<void> {
		const account = await this.findByUserId(userId);
		if (this.accountStoreEnabled && account) {
			try {
				const result = await this.identityManager.deleteAccountById(account.id);
				this.logger.log(result);
			} catch (err) {
				this.logger.error(err);
				throw err;
			}
		}
		return this.accountRepo.deleteByUserId(userId);
	}

	async searchByUsernamePartialMatch(
		userName: string,
		skip: number,
		limit: number
	): Promise<{ accounts: AccountDto[]; total: number }> {
		const accountEntities = await this.accountRepo.searchByUsernamePartialMatch(userName, skip, limit);
		return AccountEntityToDtoMapper.mapSearchResult(accountEntities);
	}

	async searchByUsernameExactMatch(userName: string): Promise<{ accounts: AccountDto[]; total: number }> {
		const accountEntities = await this.accountRepo.searchByUsernameExactMatch(userName);
		return AccountEntityToDtoMapper.mapSearchResult(accountEntities);
	}

	private encryptPassword(password: string): Promise<string> {
		return bcrypt.hash(password, 10);
	}
}
