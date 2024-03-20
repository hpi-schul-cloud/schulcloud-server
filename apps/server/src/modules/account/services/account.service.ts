import { ObjectId } from '@mikro-orm/mongodb';
import {
	DataDeletedEvent,
	DeletionService,
	DomainDeletionReport,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	UserDeletedEvent,
} from '@modules/deletion';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { AuthorizationError, EntityNotFoundError, ForbiddenOperationError, ValidationError } from '@shared/common';
import { User } from '@shared/domain/entity';
import { Counted, EntityId } from '@shared/domain/types';
import { UserRepo } from '@shared/repo/user/user.repo';
import { LegacyLogger } from '@src/core/logger';
import { isEmail, validateOrReject } from 'class-validator';
import { AccountConfig } from '../account-config';
import { Account, AccountSave, UpdateAccount, UpdateMyAccount } from '../domain';
import { AccountEntity } from '../entity/account.entity';
import { AccountServiceDb } from './account-db.service';
import { AccountServiceIdm } from './account-idm.service';
import { AbstractAccountService } from './account.service.abstract';
import { AccountValidationService } from './account.validation.service';

/* TODO: extract a service that contains all things required by feathers,
which is responsible for the additionally required validation 

it should be clearly visible which functions are only needed for feathers, and easy to remove them */

type UserPreferences = {
	// first login completed
	firstLogin: boolean;
};

@Injectable()
@EventsHandler(UserDeletedEvent)
export class AccountService extends AbstractAccountService implements DeletionService, IEventHandler<UserDeletedEvent> {
	private readonly accountImpl: AbstractAccountService;

	constructor(
		private readonly accountDb: AccountServiceDb,
		private readonly accountIdm: AccountServiceIdm,
		private readonly configService: ConfigService<AccountConfig, true>,
		private readonly accountValidationService: AccountValidationService,
		private readonly logger: LegacyLogger,
		private readonly userRepo: UserRepo,
		private readonly eventBus: EventBus
	) {
		super();
		this.logger.setContext(AccountService.name);
		if (this.configService.get<boolean>('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED') === true) {
			this.accountImpl = accountIdm;
		} else {
			this.accountImpl = accountDb;
		}
	}

	public async updateMyAccount(user: User, account: Account, updateData: UpdateMyAccount) {
		if (account.systemId) {
			throw new ForbiddenOperationError('External account details can not be changed.');
		}

		if (!updateData.passwordOld || !(await this.validatePassword(account, updateData.passwordOld))) {
			throw new AuthorizationError('Your old password is not correct.');
		}

		let updateUser = false;
		let updateAccount = false;
		if (updateData.passwordNew) {
			account.password = updateData.passwordNew;
			updateAccount = true;
		} else {
			account.password = undefined;
		}

		if (updateData.email && user.email !== updateData.email) {
			const newMail = updateData.email.toLowerCase();
			await this.checkUniqueEmail(account, user, newMail);
			user.email = newMail;
			account.username = newMail;
			updateUser = true;
			updateAccount = true;
		}

		if (updateData.firstName && user.firstName !== updateData.firstName) {
			user.firstName = updateData.firstName;
			updateUser = true;
		}

		if (updateData.lastName && user.lastName !== updateData.lastName) {
			user.lastName = updateData.lastName;
			updateUser = true;
		}

		if (updateUser) {
			try {
				await this.userRepo.save(user);
			} catch (err) {
				throw new EntityNotFoundError(User.name);
			}
		}
		if (updateAccount) {
			try {
				await this.save(account);
			} catch (err) {
				throw new EntityNotFoundError(AccountEntity.name);
			}
		}
	}

	public async updateAccount(targetUser: User, targetAccount: Account, updateData: UpdateAccount): Promise<Account> {
		let updateUser = false;
		let updateAccount = false;

		if (updateData.password !== undefined) {
			targetAccount.password = updateData.password;
			targetUser.forcePasswordChange = true;
			updateUser = true;
			updateAccount = true;
		}
		if (updateData.username !== undefined) {
			const newMail = updateData.username.toLowerCase();
			await this.checkUniqueEmail(targetAccount, targetUser, newMail);
			targetUser.email = newMail;
			targetAccount.username = newMail;
			updateUser = true;
			updateAccount = true;
		}
		if (updateData.activated !== undefined) {
			targetAccount.activated = updateData.activated;
			updateAccount = true;
		}

		if (updateUser) {
			try {
				await this.userRepo.save(targetUser);
			} catch (err) {
				throw new EntityNotFoundError(User.name);
			}
		}
		if (updateAccount) {
			try {
				return await this.save(targetAccount);
			} catch (err) {
				throw new EntityNotFoundError(AccountEntity.name);
			}
		}

		return targetAccount;
	}

	public async replaceMyTemporaryPassword(userId: EntityId, password: string, confirmPassword: string): Promise<void> {
		if (password !== confirmPassword) {
			throw new ForbiddenOperationError('Password and confirm password do not match.');
		}

		let user: User;
		try {
			user = await this.userRepo.findById(userId);
		} catch (err) {
			throw new EntityNotFoundError(User.name);
		}

		const userPreferences = <UserPreferences>user.preferences;
		const firstLoginPassed = userPreferences ? userPreferences.firstLogin : false;

		if (!user.forcePasswordChange && firstLoginPassed) {
			throw new ForbiddenOperationError('The password is not temporary, hence can not be changed.');
		} // Password change was forces or this is a first logon for the user

		const account: Account = await this.findByUserIdOrFail(userId);

		if (account.systemId) {
			throw new ForbiddenOperationError('External account details can not be changed.');
		}

		if (await this.validatePassword(account, password)) {
			throw new ForbiddenOperationError('New password can not be same as old password.');
		}

		try {
			account.password = password;
			await this.save(account);
		} catch (err) {
			throw new EntityNotFoundError(AccountEntity.name);
		}
		try {
			user.forcePasswordChange = false;
			await this.userRepo.save(user);
		} catch (err) {
			throw new EntityNotFoundError(User.name);
		}
	}

	public async handle({ deletionRequestId, targetRefId }: UserDeletedEvent): Promise<void> {
		const dataDeleted = await this.deleteUserData(targetRefId);
		await this.eventBus.publish(new DataDeletedEvent(deletionRequestId, dataDeleted));
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
			this.logger.debug(`Saving account with accountID ${ret.id} ...`);
			const account = await this.accountIdm.save(newAccount);
			this.logger.debug(`Saved account with accountID ${ret.id}`);
			return account;
		});
		return new Account({ ...ret.getProps(), idmReferenceId: idmAccount?.idmReferenceId });
	}

	async validateAccountBeforeSaveOrReject(accountSave: AccountSave) {
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
	}

	async saveWithValidation(accountSave: AccountSave): Promise<void> {
		await this.validateAccountBeforeSaveOrReject(accountSave);
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

	public async deleteByUserId(userId: string): Promise<EntityId[]> {
		const deletedAccounts = await this.accountDb.deleteByUserId(userId);
		await this.executeIdmMethod(async () => {
			this.logger.debug(`Deleting account with userId ${userId} ...`);
			const deletedAccountIdm = await this.accountIdm.deleteByUserId(userId);
			deletedAccounts.push(...deletedAccountIdm);
			this.logger.debug(`Deleted account with userId ${userId}`);
		});

		return deletedAccounts;
	}

	public async deleteUserData(userId: EntityId): Promise<DomainDeletionReport> {
		this.logger.debug(`Start deleting data for userId - ${userId} in account collection`);
		const deletedAccounts = await this.deleteByUserId(userId);

		const result = DomainDeletionReportBuilder.build(DomainName.ACCOUNT, [
			DomainOperationReportBuilder.build(OperationType.DELETE, deletedAccounts.length, deletedAccounts),
		]);

		this.logger.debug(`Deleted data for userId - ${userId} from account collection`);

		return result;
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

	private async checkUniqueEmail(account: Account, user: User, email: string): Promise<void> {
		if (!(await this.accountValidationService.isUniqueEmail(email, user.id, account.id, account.systemId))) {
			throw new ValidationError(`The email address is already in use!`);
		}
	}
}
