import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ValidationError } from '@shared/common';
import { Counted } from '@shared/domain/types';
import { isEmail, validateOrReject } from 'class-validator';
import { LegacyLogger } from '../../../core/logger'; // TODO: use path alias
// TODO: account needs to define its own config, which is made available for the server
import { ServerConfig } from '../../server/server.config';
import { AccountServiceDb } from './account-db.service';
import { AccountServiceIdm } from './account-idm.service';
import { AbstractAccountService } from './account.service.abstract';
import { AccountValidationService } from './account.validation.service';
import { Account, AccountSave } from '../domain';

/* TODO: extract a service that contains all things required by feathers,
which is responsible for the additionally required validation 

it should be clearly visible which functions are only needed for feathers, and easy to remove them */

@Injectable()
export class AccountService extends AbstractAccountService {
	private readonly accountImpl: AbstractAccountService;

	constructor(
		private readonly accountDb: AccountServiceDb,
		private readonly accountIdm: AccountServiceIdm,
		private readonly configService: ConfigService<ServerConfig, true>,
		private readonly accountValidationService: AccountValidationService,
		private readonly logger: LegacyLogger
	) {
		super();
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

	async save(accountSave: AccountSave): Promise<Account> {
		const ret = await this.accountDb.save(accountSave);
		const newAccount: AccountSave = {
			...accountSave,
			id: accountSave.id,
			idmReferenceId: ret.id,
			password: accountSave.password,
		};
		const idmAccount = await this.executeIdmMethod(async () => {
			this.logger.debug(`Saving account with accountID ${ret.id ?? 'undefined'} ...`);
			const account = await this.accountIdm.save(newAccount);
			this.logger.debug(`Saved account with accountID ${ret.id ?? 'undefined'}`);
			return account;
		});
		return new Account({ ...ret.getProps(), idmReferenceId: idmAccount?.idmReferenceId });
	}

	async saveWithValidation(accountSave: AccountSave): Promise<void> {
		// TODO: move as much as possible into the class validator
		await validateOrReject(accountSave);
		// sanatizeUsername ✔
		if (!accountSave.systemId) {
			accountSave.username = accountSave.username.trim().toLowerCase();
		}
		if (!accountSave.systemId && !accountSave.password) {
			throw new ValidationError('No password provided');
		}
		// validateUserName ✔
		// usernames must be an email address, if they are not from an external system
		if (!accountSave.systemId && !isEmail(accountSave.username)) {
			throw new ValidationError('Username is not an email');
		}
		// checkExistence ✔
		if (accountSave.userId && (await this.findByUserId(accountSave.userId))) {
			throw new ValidationError('Account already exists');
		}
		// validateCredentials hook will not be ported ✔
		// trimPassword hook will be done by class-validator ✔
		// local.hooks.hashPassword('password'), will be done by account service ✔
		// checkUnique ✔
		if (
			!(await this.accountValidationService.isUniqueEmail(
				accountSave.username,
				accountSave.userId,
				accountSave.id,
				accountSave.systemId
			))
		) {
			throw new ValidationError('Username already exists');
		}
		// removePassword hook is not implemented
		// const noPasswordStrategies = ['ldap', 'moodle', 'iserv'];
		// if (dto.passwordStrategy && noPasswordStrategies.includes(dto.passwordStrategy)) {
		// 	dto.password = undefined;
		// }

		// TODO: split validation from saving, so it can be used independently
		await this.save(accountSave);
	}

	async updateUsername(accountId: string, username: string): Promise<Account> {
		const ret = await this.accountDb.updateUsername(accountId, username);
		const idmAccount = await this.executeIdmMethod(async () => {
			this.logger.debug(`Updating username for account with accountID ${accountId} ...`);
			const account = await this.accountIdm.updateUsername(accountId, username);
			this.logger.debug(`Updated username for account with accountID ${accountId}`);
			return account;
		});
		return new Account({ ...ret.getProps(), idmReferenceId: idmAccount?.idmReferenceId });
	}

	async updateLastTriedFailedLogin(accountId: string, lastTriedFailedLogin: Date): Promise<Account> {
		const ret = await this.accountDb.updateLastTriedFailedLogin(accountId, lastTriedFailedLogin);
		const idmAccount = await this.executeIdmMethod(async () => {
			this.logger.debug(`Updating last tried failed login for account with accountID ${accountId} ...`);
			const account = await this.accountIdm.updateLastTriedFailedLogin(accountId, lastTriedFailedLogin);
			this.logger.debug(`Updated last tried failed login for account with accountID ${accountId}`);
			return account;
		});
		return new Account({ ...ret.getProps(), idmReferenceId: idmAccount?.idmReferenceId });
	}

	async updatePassword(accountId: string, password: string): Promise<Account> {
		const ret = await this.accountDb.updatePassword(accountId, password);
		const idmAccount = await this.executeIdmMethod(async () => {
			this.logger.debug(`Updating password for account with accountID ${accountId} ...`);
			const account = await this.accountIdm.updatePassword(accountId, password);
			this.logger.debug(`Updated password for account with accountID ${accountId}`);
			return account;
		});
		return new Account({ ...ret.getProps(), idmReferenceId: idmAccount?.idmReferenceId });
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
