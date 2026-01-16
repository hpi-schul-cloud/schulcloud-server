import { Logger } from '@core/logger';
import { ObjectId } from '@mikro-orm/mongodb';
import { UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { Inject, Injectable } from '@nestjs/common';
import {
	AuthorizationError,
	EntityNotFoundError,
	ForbiddenOperationError,
	ValidationError,
} from '@shared/common/error';
import { Counted, EntityId } from '@shared/domain/types';
import { isEmail, isNotEmpty } from 'class-validator';
import { ACCOUNT_CONFIG_TOKEN, AccountConfig } from '../../account-config';
import { Account, AccountSave, UpdateAccount, UpdateMyAccount } from '../do';
import {
	DeletedAccountLoggable,
	DeletedAccountWithUserIdLoggable,
	DeletingAccountLoggable,
	DeletingAccountWithUserIdLoggable,
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
import { ACCOUNT_REPO, AccountRepo } from '../interface';
import { AccountServiceDb } from './account-db.service';
import { AccountServiceIdm } from './account-idm.service';
import { AbstractAccountService } from './account.service.abstract';

type UserPreferences = {
	firstLogin: boolean;
};

@Injectable()
export class AccountService extends AbstractAccountService {
	private readonly accountImpl: AbstractAccountService;

	constructor(
		private readonly accountDb: AccountServiceDb,
		private readonly accountIdm: AccountServiceIdm,
		@Inject(ACCOUNT_CONFIG_TOKEN) private readonly config: AccountConfig,
		private readonly logger: Logger,
		private readonly userService: UserService,
		@Inject(ACCOUNT_REPO) private readonly accountRepo: AccountRepo
	) {
		super();
		this.logger.setContext(AccountService.name);
		if (this.config.identityManagementLoginEnabled === true) {
			this.accountImpl = accountIdm;
		} else {
			this.accountImpl = accountDb;
		}
	}

	public async updateMyAccount(user: User, account: Account, updateData: UpdateMyAccount): Promise<void> {
		await this.checkUpdateMyAccountPrerequisites(updateData, account);

		const accountSave = new AccountSave({
			id: account.id,
		});

		const updatedPassword = this.updateAccountPassword(updateData, accountSave);
		const updatedEmail = await this.updateUserEmail(updateData, user, account, accountSave);
		const updatedNames = this.updateUserNames(updateData, user);

		const updateUser = updatedNames || updatedEmail;
		const updateAccount = updatedPassword || updatedEmail;

		if (updateUser) {
			try {
				await this.userService.saveEntity(user);
			} catch (err: unknown) {
				throw new EntityNotFoundError('User');
			}
		}
		if (updateAccount) {
			try {
				await this.save(accountSave);
			} catch (err: unknown) {
				if (err instanceof ValidationError) {
					throw err;
				}
				throw new EntityNotFoundError('AccountEntity');
			}
		}
	}

	private updateAccountPassword(updateData: UpdateMyAccount, accountSave: AccountSave): boolean {
		if (updateData.passwordNew) {
			accountSave.password = updateData.passwordNew;
			return true;
		}
		return false;
	}

	private async updateUserEmail(
		updateData: UpdateMyAccount,
		user: User,
		account: Account,
		accountSave: AccountSave
	): Promise<boolean> {
		if (updateData.email && user.email !== updateData.email) {
			const newMail = updateData.email.toLowerCase();
			await this.checkUniqueEmail(newMail);
			user.email = newMail;
			accountSave.username = newMail;
			return true;
		}
		return false;
	}

	private updateUserNames(updateData: UpdateMyAccount, user: User): boolean {
		let updateUserName = false;
		if (updateData.firstName && user.firstName !== updateData.firstName) {
			user.firstName = updateData.firstName;
			updateUserName = true;
		}

		if (updateData.lastName && user.lastName !== updateData.lastName) {
			user.lastName = updateData.lastName;
			updateUserName = true;
		}

		return updateUserName;
	}

	private async checkUpdateMyAccountPrerequisites(updateData: UpdateMyAccount, account: Account): Promise<void> {
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
			await this.checkUniqueEmail(newMail);
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
				await this.userService.saveEntity(targetUser);
			} catch (err) {
				throw new EntityNotFoundError('User');
			}
		}
		if (updateAccount) {
			try {
				return await this.save(targetAccount);
			} catch (err) {
				throw new EntityNotFoundError('AccountEntity');
			}
		}

		return targetAccount;
	}

	public async deactivateAccount(userId: EntityId, deactivatedAt: Date): Promise<void> {
		const account = await this.accountRepo.findByUserIdOrFail(userId);
		account.deactivatedAt = deactivatedAt;

		await this.save(account);
	}

	public async reactivateAccount(userId: EntityId): Promise<void> {
		const account = await this.accountRepo.findByUserIdOrFail(userId);
		account.deactivatedAt = undefined;
		await this.save(account);
	}

	public async deactivateMultipleAccounts(userIds: EntityId[], deactivatedAt: Date): Promise<void> {
		await this.accountRepo.deactivateMultipleByUserIds(userIds, deactivatedAt);
	}

	public async replaceMyTemporaryPassword(userId: EntityId, password: string, confirmPassword: string): Promise<void> {
		if (password !== confirmPassword) {
			throw new ForbiddenOperationError('Password and confirm password do not match.');
		}

		let user: User;
		try {
			user = await this.userService.getUserEntityWithRoles(userId);
		} catch (err) {
			throw new EntityNotFoundError('User');
		}

		const userPreferences = <UserPreferences>user.preferences;
		const firstLoginPassed = userPreferences ? userPreferences.firstLogin : false;

		if (!user.forcePasswordChange && firstLoginPassed) {
			throw new ForbiddenOperationError('The password is not temporary, hence can not be changed.', { userId });
		} // Password change was forces or this is a first logon for the user

		const account: Account = await this.findByUserIdOrFail(userId);

		if (account.systemId) {
			throw new ForbiddenOperationError('External account details can not be changed.', { userId });
		}

		if (await this.validatePassword(account, password)) {
			throw new ForbiddenOperationError('New password can not be same as old password.', { userId });
		}

		try {
			account.password = password;
			await this.save(account);
		} catch (err) {
			throw new EntityNotFoundError('AccountEntity');
		}
		try {
			user.forcePasswordChange = false;
			await this.userService.saveEntity(user);
		} catch (err) {
			throw new EntityNotFoundError('User');
		}
	}

	public findById(id: string): Promise<Account> {
		const account = this.accountImpl.findById(id);
		return account;
	}

	public findMultipleByUserId(userIds: string[]): Promise<Account[]> {
		const accounts = this.accountImpl.findMultipleByUserId(userIds);
		return accounts;
	}

	public findByUserId(userId: string): Promise<Account | null> {
		const account = this.accountImpl.findByUserId(userId);
		return account;
	}

	public findByUserIdOrFail(userId: string): Promise<Account> {
		const account = this.accountImpl.findByUserIdOrFail(userId);
		return account;
	}

	public findByUsernameAndSystemId(username: string, systemId: string | ObjectId): Promise<Account | null> {
		const account = this.accountImpl.findByUsernameAndSystemId(username, systemId);
		return account;
	}

	public searchByUsernamePartialMatch(userName: string, skip: number, limit: number): Promise<Counted<Account[]>> {
		const result = this.accountImpl.searchByUsernamePartialMatch(userName, skip, limit);
		return result;
	}

	public searchByUsernameExactMatch(userName: string): Promise<Counted<Account[]>> {
		const result = this.accountImpl.searchByUsernameExactMatch(userName);
		return result;
	}

	public async save(accountSave: AccountSave): Promise<Account> {
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

		if (this.config.identityManagementStoreEnabled === true) {
			if (
				idmAccount === null ||
				(accountSave.username && idmAccount.username.toLowerCase() !== accountSave.username.toLowerCase())
			) {
				throw new ValidationError('Account could not be updated');
			}
		}

		return new Account({ ...ret.getProps(), idmReferenceId: idmAccount?.idmReferenceId });
	}

	public async saveAll(accountSaves: AccountSave[]): Promise<Account[]> {
		const savedDbAccounts = await this.accountDb.saveAll(accountSaves);

		const newAccounts = savedDbAccounts.map((savedDbAccount, index) => {
			const accountSave = accountSaves[index];

			return new AccountSave({
				...accountSave,
				id: accountSave.id,
				idmReferenceId: savedDbAccount.id,
				password: accountSave.password,
			});
		});

		const idmAccounts = await this.executeIdmMethod(async () => {
			const account = await this.accountIdm.saveAll(newAccounts);

			return account;
		});

		const combinedAccounts = savedDbAccounts.map((savedDbAccount, index) => {
			const idmReferenceId = idmAccounts ? idmAccounts[index].idmReferenceId : undefined;
			return new Account({ ...savedDbAccount.getProps(), idmReferenceId });
		});

		return combinedAccounts;
	}

	public async validateAccountBeforeSaveOrReject(accountSave: AccountSave): Promise<void> {
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
		if (!(await this.isUniqueEmail(accountSave.username))) {
			throw new ValidationError('Username already exists');
		}
		// removePassword hook is not implemented
		// const noPasswordStrategies = ['ldap', 'moodle', 'iserv'];
		// if (dto.passwordStrategy && noPasswordStrategies.includes(dto.passwordStrategy)) {
		// 	dto.password = undefined;
		// }
	}

	public async saveWithValidation(accountSave: AccountSave): Promise<void> {
		await this.validateAccountBeforeSaveOrReject(accountSave);
		await this.save(accountSave);
	}

	public async updateUsername(accountId: string, username: string): Promise<Account> {
		const ret = await this.accountDb.updateUsername(accountId, username);
		const idmAccount = await this.executeIdmMethod(async () => {
			this.logger.debug(new UpdatingAccountUsernameLoggable(accountId));
			const account = await this.accountIdm.updateUsername(accountId, username);
			this.logger.debug(new UpdatedAccountUsernameLoggable(accountId));
			return account;
		});
		return new Account({ ...ret.getProps(), idmReferenceId: idmAccount?.idmReferenceId });
	}

	public async updateLastLogin(accountId: string, lastLogin: Date): Promise<void> {
		await this.accountDb.updateLastLogin(accountId, lastLogin);
	}

	public async updateLastTriedFailedLogin(accountId: string, lastTriedFailedLogin: Date): Promise<Account> {
		const ret = await this.accountDb.updateLastTriedFailedLogin(accountId, lastTriedFailedLogin);
		const idmAccount = await this.executeIdmMethod(async () => {
			this.logger.debug(new UpdatingLastFailedLoginLoggable(accountId));
			const account = await this.accountIdm.updateLastTriedFailedLogin(accountId, lastTriedFailedLogin);
			this.logger.debug(new UpdatedLastFailedLoginLoggable(accountId));
			return account;
		});
		return new Account({ ...ret.getProps(), idmReferenceId: idmAccount?.idmReferenceId });
	}

	public async updatePassword(accountId: string, password: string): Promise<Account> {
		const ret = await this.accountDb.updatePassword(accountId, password);
		const idmAccount = await this.executeIdmMethod(async () => {
			this.logger.debug(new UpdatingAccountPasswordLoggable(accountId));
			const account = await this.accountIdm.updatePassword(accountId, password);
			this.logger.debug(new UpdatedAccountPasswordLoggable(accountId));
			return account;
		});
		return new Account({ ...ret.getProps(), idmReferenceId: idmAccount?.idmReferenceId });
	}

	public validatePassword(account: Account, comparePassword: string): Promise<boolean> {
		const result = this.accountImpl.validatePassword(account, comparePassword);
		return result;
	}

	public async delete(accountId: string): Promise<void> {
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

	/**
	 * @deprecated For migration purpose only
	 */
	public findMany(offset = 0, limit = 100): Promise<Account[]> {
		const accounts = this.accountDb.findMany(offset, limit);
		return accounts;
	}

	private async executeIdmMethod<T>(idmCallback: () => Promise<T>): Promise<T | null> {
		if (this.config.identityManagementStoreEnabled === true) {
			try {
				return await idmCallback();
			} catch (error) {
				this.logger.debug(new IdmCallbackLoggableException(error));
			}
		}
		return null;
	}

	private async checkUniqueEmail(email: string): Promise<void> {
		if (!(await this.isUniqueEmail(email))) {
			throw new ValidationError(`The email address is already in use!`);
		}
	}

	public async findByUserIdsAndSystemId(usersIds: string[], systemId: string): Promise<string[]> {
		const foundAccounts = await this.accountRepo.findByUserIdsAndSystemId(usersIds, systemId);

		return foundAccounts;
	}

	public async isUniqueEmail(email: string): Promise<boolean> {
		const isUniqueEmail = await this.accountImpl.isUniqueEmail(email);

		return isUniqueEmail;
	}
}
