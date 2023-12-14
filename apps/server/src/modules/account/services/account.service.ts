import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ValidationError } from '@shared/common';
import { Counted } from '@shared/domain/types';
import { isEmail, validateOrReject } from 'class-validator';
import { LegacyLogger } from '../../../core/logger';
import { ServerConfig } from '../../server/server.config';
import { AccountServiceDb } from './account-db.service';
import { AccountServiceIdm } from './account-idm.service';
import { AbstractAccountService } from './account.service.abstract';
import { AccountValidationService } from './account.validation.service';
import { Account } from '../domain/account';

@Injectable()
export class AccountService {
	private readonly accountImpl: AbstractAccountService;

	constructor(
		private readonly accountDb: AccountServiceDb,
		private readonly accountIdm: AccountServiceIdm,
		private readonly configService: ConfigService<ServerConfig, true>,
		private readonly accountValidationService: AccountValidationService,
		private readonly logger: LegacyLogger
	) {
		this.logger.setContext(AccountService.name);
		if (this.configService.get<boolean>('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED') === true) {
			this.accountImpl = accountIdm;
		} else {
			this.accountImpl = accountDb;
		}
	}

	async findById(id: string): Promise<Account> {
		return this.accountImpl.findById(id);
	}

	async findMultipleByUserId(userIds: string[]): Promise<Account[]> {
		return this.accountImpl.findMultipleByUserId(userIds);
	}

	async findByUserId(userId: string): Promise<Account | null> {
		return this.accountImpl.findByUserId(userId);
	}

	async findByUserIdOrFail(userId: string): Promise<Account> {
		return this.accountImpl.findByUserIdOrFail(userId);
	}

	async findByUsernameAndSystemId(username: string, systemId: string | ObjectId): Promise<Account | null> {
		return this.accountImpl.findByUsernameAndSystemId(username, systemId);
	}

	async searchByUsernamePartialMatch(userName: string, skip: number, limit: number): Promise<Counted<Account[]>> {
		return this.accountImpl.searchByUsernamePartialMatch(userName, skip, limit);
	}

	async searchByUsernameExactMatch(userName: string): Promise<Counted<Account[]>> {
		return this.accountImpl.searchByUsernameExactMatch(userName);
	}

	async save(account: Account): Promise<Account> {
		const ret = await this.accountDb.save(account);
		const newAccount = new Account(ret);
		newAccount.idmReferenceId = newAccount?.idmReferenceId;
		const idmAccount = await this.executeIdmMethod(async () => {
			this.logger.debug(`Saving account with accountID ${ret.id} ...`);
			const accountIdm = await this.accountIdm.save(newAccount);
			this.logger.debug(`Saved account with accountID ${ret.id}`);
			return accountIdm;
		});
		const accountdo = new Account(ret);
		accountdo.idmReferenceId = idmAccount?.idmReferenceId;
		return account;
	}

	async saveWithValidation(dto: Account): Promise<void> {
		await validateOrReject(dto);
		// sanatizeUsername ✔
		if (!dto.systemId) {
			dto.setUsername(dto.username.trim().toLowerCase());
		}
		if (!dto.systemId && !dto.password) {
			throw new ValidationError('No password provided');
		}
		// validateUserName ✔
		// usernames must be an email address, if they are not from an external system
		if (!dto.systemId && !isEmail(dto.username)) {
			throw new ValidationError('Username is not an email');
		}
		// checkExistence ✔
		if (dto.userId && (await this.findByUserId(dto.userId))) {
			throw new ValidationError('Account already exists');
		}
		// validateCredentials hook will not be ported ✔
		// trimPassword hook will be done by class-validator ✔
		// local.hooks.hashPassword('password'), will be done by account service ✔
		// checkUnique ✔
		if (!(await this.accountValidationService.isUniqueEmail(dto.username, dto.userId, dto.id, dto.systemId))) {
			throw new ValidationError('Username already exists');
		}
		// removePassword hook is not implemented
		// const noPasswordStrategies = ['ldap', 'moodle', 'iserv'];
		// if (dto.passwordStrategy && noPasswordStrategies.includes(dto.passwordStrategy)) {
		// 	dto.password = undefined;
		// }

		await this.save(dto);
	}

	async updateUsername(accountId: string, username: string): Promise<Account> {
		const ret = await this.accountDb.updateUsername(accountId, username);
		const idmAccount = await this.executeIdmMethod(async () => {
			this.logger.debug(`Updating username for account with accountID ${accountId} ...`);
			const account = await this.accountIdm.updateUsername(accountId, username);
			this.logger.debug(`Updated username for account with accountID ${accountId}`);
			return account;
		});
		const account = new Account(ret);
		account.idmReferenceId = idmAccount?.idmReferenceId;
		return account;
	}

	async updateLastTriedFailedLogin(accountId: string, lastTriedFailedLogin: Date): Promise<Account> {
		const ret = await this.accountDb.updateLastTriedFailedLogin(accountId, lastTriedFailedLogin);
		const idmAccount = await this.executeIdmMethod(async () => {
			this.logger.debug(`Updating last tried failed login for account with accountID ${accountId} ...`);
			const account = await this.accountIdm.updateLastTriedFailedLogin(accountId, lastTriedFailedLogin);
			this.logger.debug(`Updated last tried failed login for account with accountID ${accountId}`);
			return account;
		});
		const account = new Account(ret);
		account.idmReferenceId = idmAccount?.idmReferenceId;
		return account;
	}

	async updatePassword(accountId: string, password: string): Promise<Account> {
		const ret = await this.accountDb.updatePassword(accountId, password);
		const idmAccount = await this.executeIdmMethod(async () => {
			this.logger.debug(`Updating password for account with accountID ${accountId} ...`);
			const account = await this.accountIdm.updatePassword(accountId, password);
			this.logger.debug(`Updated password for account with accountID ${accountId}`);
			return account;
		});
		// TODO: create mapper
		const account = new Account(ret);
		account.idmReferenceId = idmAccount?.idmReferenceId;
		return account;
	}

	async validatePassword(account: Account, comparePassword: string): Promise<boolean> {
		return this.accountImpl.validatePassword(account, comparePassword);
	}

	async delete(accountId: string): Promise<void> {
		await this.accountDb.delete(accountId);
		await this.executeIdmMethod(async () => {
			this.logger.debug(`Deleting account with accountId ${accountId} ...`);
			await this.accountIdm.delete(accountId);
			this.logger.debug(`Deleted account with accountId ${accountId}`);
		});
	}

	async deleteByUserId(userId: string): Promise<void> {
		await this.accountDb.deleteByUserId(userId);
		await this.executeIdmMethod(async () => {
			this.logger.debug(`Deleting account with userId ${userId} ...`);
			await this.accountIdm.deleteByUserId(userId);
			this.logger.debug(`Deleted account with userId ${userId}`);
		});
	}

	/**
	 * @deprecated For migration purpose only
	 */
	async findMany(offset = 0, limit = 100): Promise<Account[]> {
		return this.accountDb.findMany(offset, limit);
	}

	private async executeIdmMethod<T>(idmCallback: () => Promise<T>) {
		if (this.configService.get('FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED') === true) {
			try {
				return await idmCallback();
			} catch (error) {
				if (error instanceof Error) {
					this.logger.error(error, error.stack);
				} else {
					this.logger.error(error);
				}
			}
		}
		return null;
	}
}
