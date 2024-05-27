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
import { Logger } from '@src/core/logger';
import { isEmail, isNotEmpty } from 'class-validator';
import { AccountConfig } from '../../account-config';
import { Account, AccountSave, UpdateAccount, UpdateMyAccount } from '..';
import { AccountEntity } from '../entity/account.entity';
import {
	DeletedAccountLoggable,
	DeletedAccountWithUserIdLoggable,
	DeletedUserDataLoggable,
	DeletingAccountLoggable,
	DeletingAccountWithUserIdLoggable,
	DeletingUserDataLoggable,
	IdmCallbackLoggableException,
	SavedAccountLoggable,
	SavingAccountLoggable,
	UpdatedAccountPasswordLoggable,
	UpdatedAccountUsernameLoggable,
	UpdatedLastFailedLoginLoggable,
	UpdatingAccountPasswordLoggable,
	UpdatingAccountUsernameLoggable,
	UpdatingLastFailedLoginLoggable,
} from '../error';
import { AccountRepo } from '../../repo/micro-orm/account.repo';
import { AccountServiceDb } from './account-db.service';
import { AccountServiceIdm } from './account-idm.service';
import { AbstractAccountService } from './account.service.abstract';
import { AccountValidationService } from './account.validation.service';

type UserPreferences = {
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
		private readonly logger: Logger,
		private readonly userRepo: UserRepo,
		private readonly accountRepo: AccountRepo,
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
		await this.checkUpdateMyAccountPrerequisites(updateData, account);

		let updateUser = false;
		let updateAccount = false;

		let newAccountPassword: string | undefined;
		let newAccountUsername: string | undefined;

		if (updateData.passwordNew) {
			newAccountPassword = updateData.passwordNew;
			updateAccount = true;
		}

		if (updateData.email && user.email !== updateData.email) {
			const newMail = updateData.email.toLowerCase();
			await this.checkUniqueEmail(account, user, newMail);
			user.email = newMail;
			newAccountUsername = newMail;
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
				const updateProps = new AccountSave({
					id: account.id,
					password: newAccountPassword,
					username: newAccountUsername,
				});

				await this.save(updateProps);
			} catch (err) {
				if (err instanceof ValidationError) {
					throw err;
				}
				throw new EntityNotFoundError(AccountEntity.name);
			}
		}
	}

	private async checkUpdateMyAccountPrerequisites(updateData: UpdateMyAccount, account: Account) {
		if (account.systemId) {
			throw new ForbiddenOperationError('External account details can not be changed.');
		}

		if (!updateData.passwordOld || !(await this.validatePassword(account, updateData.passwordOld))) {
			throw new AuthorizationError('Your old password is not correct.');
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
		const newAccount = new AccountSave({
			...accountSave,
			id: accountSave.id,
			idmReferenceId: ret.id,
			password: accountSave.password,
		});
		const idmAccount = await this.executeIdmMethod(async () => {
			this.logger.debug(new SavingAccountLoggable(ret.id));
			const account = await this.accountIdm.save(newAccount);
			this.logger.debug(new SavedAccountLoggable(ret.id));
			return account;
		});

		if (this.configService.get('FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED') === true) {
			if (idmAccount === null || idmAccount.username !== accountSave.username) {
				throw new ValidationError('Account could not be updated');
			}
		}

		return new Account({ ...ret.getProps(), idmReferenceId: idmAccount?.idmReferenceId });
	}

	async validateAccountBeforeSaveOrReject(accountSave: AccountSave) {
		// if username is undefined or empty, throw error ✔
		if (!accountSave.username || !isNotEmpty(accountSave.username)) {
			throw new ValidationError('username can not be empty');
		}

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
			this.logger.debug(new UpdatingAccountUsernameLoggable(accountId));
			const account = await this.accountIdm.updateUsername(accountId, username);
			this.logger.debug(new UpdatedAccountUsernameLoggable(accountId));
			return account;
		});
		return new Account({ ...ret.getProps(), idmReferenceId: idmAccount?.idmReferenceId });
	}

	async updateLastTriedFailedLogin(accountId: string, lastTriedFailedLogin: Date): Promise<Account> {
		const ret = await this.accountDb.updateLastTriedFailedLogin(accountId, lastTriedFailedLogin);
		const idmAccount = await this.executeIdmMethod(async () => {
			this.logger.debug(new UpdatingLastFailedLoginLoggable(accountId));
			const account = await this.accountIdm.updateLastTriedFailedLogin(accountId, lastTriedFailedLogin);
			this.logger.debug(new UpdatedLastFailedLoginLoggable(accountId));
			return account;
		});
		return new Account({ ...ret.getProps(), idmReferenceId: idmAccount?.idmReferenceId });
	}

	async updatePassword(accountId: string, password: string): Promise<Account> {
		const ret = await this.accountDb.updatePassword(accountId, password);
		const idmAccount = await this.executeIdmMethod(async () => {
			this.logger.debug(new UpdatingAccountPasswordLoggable(accountId));
			const account = await this.accountIdm.updatePassword(accountId, password);
			this.logger.debug(new UpdatedAccountPasswordLoggable(accountId));
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
			this.logger.debug(new DeletingAccountLoggable(accountId));
			await this.accountIdm.delete(accountId);
			this.logger.debug(new DeletedAccountLoggable(accountId));
		});
	}

	public async deleteByUserId(userId: string): Promise<EntityId[]> {
		const deletedAccounts = await this.accountDb.deleteByUserId(userId);
		await this.executeIdmMethod(async () => {
			this.logger.debug(new DeletingAccountWithUserIdLoggable(userId));
			const deletedAccountIdm = await this.accountIdm.deleteByUserId(userId);
			deletedAccounts.push(...deletedAccountIdm);
			this.logger.debug(new DeletedAccountWithUserIdLoggable(userId));
		});

		return deletedAccounts;
	}

	public async deleteUserData(userId: EntityId): Promise<DomainDeletionReport> {
		this.logger.debug(new DeletingUserDataLoggable(userId));
		const deletedAccounts = await this.deleteByUserId(userId);

		const result = DomainDeletionReportBuilder.build(DomainName.ACCOUNT, [
			DomainOperationReportBuilder.build(OperationType.DELETE, deletedAccounts.length, deletedAccounts),
		]);

		this.logger.debug(new DeletedUserDataLoggable(userId));

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
				this.logger.debug(new IdmCallbackLoggableException(error));
			}
		}
		return null;
	}

	private async checkUniqueEmail(account: Account, user: User, email: string): Promise<void> {
		if (!(await this.accountValidationService.isUniqueEmail(email, user.id, account.id, account.systemId))) {
			throw new ValidationError(`The email address is already in use!`);
		}
	}

	async findByUserIdsAndSystemId(usersIds: string[], systemId: string): Promise<string[]> {
		const foundAccounts = await this.accountRepo.findByUserIdsAndSystemId(usersIds, systemId);

		return foundAccounts;
	}
}
