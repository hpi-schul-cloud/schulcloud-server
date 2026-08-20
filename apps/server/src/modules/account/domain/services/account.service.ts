import { Logger } from '@infra/logger';
import { ObjectId } from '@mikro-orm/mongodb';
import { User, UserService } from '@modules/user';
import { Inject, Injectable } from '@nestjs/common';
import {
	AuthorizationError,
	EntityNotFoundError,
	ForbiddenOperationError,
	ValidationError,
} from '@shared/common/error';
import { Counted, EntityId } from '@shared/domain/types';
import bcrypt from 'bcryptjs';
import { isEmail, isNotEmpty } from 'class-validator';
import { Account, AccountSave, UpdateAccount, UpdateMyAccount } from '../do';
import { ACCOUNT_REPO, AccountRepo } from '../interface';

type UserPreferences = {
	firstLogin: boolean;
};

type Options = {
	allowUpdate?: boolean;
};
@Injectable()
export class AccountService {
	constructor(
		private readonly logger: Logger,
		private readonly userService: UserService,
		@Inject(ACCOUNT_REPO) private readonly accountRepo: AccountRepo
	) {
		this.logger.setContext(AccountService.name);
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
			} catch {
				// TODO: handle error
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
			} catch {
				throw new EntityNotFoundError('User');
			}
		}
		if (updateAccount) {
			try {
				return await this.save(targetAccount);
			} catch {
				throw new EntityNotFoundError('AccountEntity');
			}
		}

		return targetAccount;
	}

	public async deactivateAccount(userId: EntityId, deactivatedAt: Date): Promise<Account> {
		const account = await this.accountRepo.findByUserIdOrFail(userId);
		account.deactivatedAt = deactivatedAt;

		await this.save(account);

		return account;
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
		} catch {
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
		} catch {
			throw new EntityNotFoundError('AccountEntity');
		}
		try {
			user.forcePasswordChange = false;
			await this.userService.saveEntity(user);
		} catch {
			throw new EntityNotFoundError('User');
		}
	}

	public findById(id: string): Promise<Account> {
		const objectId = this.ensureValidObjectId(id);
		const account = this.accountRepo.findById(objectId);

		return account;
	}

	public findMultipleByUserId(userIds: string[]): Promise<Account[]> {
		const accounts = this.accountRepo.findMultipleByUserId(userIds);

		return accounts;
	}

	public findByUserId(userId: string): Promise<Account | null> {
		const account = this.accountRepo.findByUserId(userId);

		return account;
	}

	public findByUserIdOrFail(userId: string): Promise<Account> {
		const account = this.accountRepo.findByUserIdOrFail(userId);

		return account;
	}

	public findByUsernameAndSystemId(username: string, systemId: string | ObjectId): Promise<Account | null> {
		const account = this.accountRepo.findByUsernameAndSystemId(username, systemId);

		return account;
	}

	public searchByUsernamePartialMatch(userName: string, skip: number, limit: number): Promise<Counted<Account[]>> {
		const result = this.accountRepo.searchByUsernamePartialMatch(userName, skip, limit);

		return result;
	}

	public searchByUsernameExactMatch(userName: string): Promise<Counted<Account[]>> {
		const result = this.accountRepo.searchByUsernameExactMatch(userName);

		return result;
	}

	public async save(accountSave: AccountSave): Promise<Account> {
		let account: Account;
		if (accountSave.id) {
			const objectId = this.ensureValidObjectId(accountSave.id);

			account = await this.accountRepo.findById(objectId);
		} else {
			account = this.createAccount(accountSave);
		}

		await account.update(accountSave);
		const ret = await this.accountRepo.save(account);

		return new Account({ ...ret.getProps() });
	}

	public async saveAll(accountSaves: AccountSave[]): Promise<Account[]> {
		const updatedAccounts = await Promise.all(
			accountSaves.map(async (accountSave) => {
				let account: Account;
				if (accountSave.id) {
					const objectId = this.ensureValidObjectId(accountSave.id);

					account = await this.accountRepo.findById(objectId);
				} else {
					account = this.createAccount(accountSave);
				}
				await account.update(accountSave);
				return account;
			})
		);

		const savedDbAccounts = await this.accountRepo.saveAll(updatedAccounts);

		return savedDbAccounts;
	}

	public async validateAccountBeforeSaveOrReject(accountSave: AccountSave, options?: Options): Promise<void> {
		options = options || { allowUpdate: false };
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

		if (options.allowUpdate === false) {
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
	}

	public async saveWithValidation(accountSave: AccountSave, options?: Options): Promise<void> {
		await this.validateAccountBeforeSaveOrReject(accountSave, options);
		await this.save(accountSave);
	}

	public async updateUsername(accountId: string, username: string): Promise<Account> {
		const objectId = this.ensureValidObjectId(accountId);
		const account = await this.accountRepo.findById(objectId);
		account.username = username;
		const ret = await this.accountRepo.save(account);

		return new Account({ ...ret.getProps() });
	}

	public async updateLastLogin(accountId: string, lastLogin: Date): Promise<void> {
		const objectId = this.ensureValidObjectId(accountId);
		const account = await this.accountRepo.findById(objectId);
		account.lastLogin = lastLogin;
		await this.accountRepo.save(account);
	}

	public async updateLastTriedFailedLogin(accountId: string, lastTriedFailedLogin: Date): Promise<Account> {
		const objectId = this.ensureValidObjectId(accountId);
		const account = await this.accountRepo.findById(objectId);
		account.lasttriedFailedLogin = lastTriedFailedLogin;
		const ret = await this.accountRepo.save(account);

		return new Account({ ...ret.getProps() });
	}

	public async updatePassword(accountId: string, password: string): Promise<Account> {
		const objectId = this.ensureValidObjectId(accountId);
		const account = await this.accountRepo.findById(objectId);
		account.password = await this.encryptPassword(password);
		const ret = await this.accountRepo.save(account);

		return new Account({ ...ret.getProps() });
	}

	public validatePassword(account: Account, comparePassword: string): Promise<boolean> {
		if (!account.password) {
			return Promise.resolve(false);
		}

		const result = bcrypt.compare(comparePassword, account.password);

		return result;
	}

	public async delete(accountId: string): Promise<void> {
		const objectId = this.ensureValidObjectId(accountId);
		await this.accountRepo.deleteById(objectId);
	}

	public async deleteByUserId(userId: string): Promise<EntityId[]> {
		const deletedAccounts = await this.accountRepo.deleteByUserId(userId);

		return deletedAccounts;
	}

	/**
	 * @deprecated For migration purpose only
	 */
	public findMany(offset = 0, limit = 100): Promise<Account[]> {
		const accounts = this.accountRepo.findMany(offset, limit);

		return accounts;
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
		const account = await this.accountRepo.findByUsername(email);
		const isUniqueEmail = !account;

		return isUniqueEmail;
	}

	private ensureValidObjectId(id: EntityId | ObjectId): ObjectId {
		if (id instanceof ObjectId || ObjectId.isValid(id)) {
			return new ObjectId(id);
		}
		throw new EntityNotFoundError(`Account with id ${id.toString()} not found`);
	}

	private encryptPassword(password: string): Promise<string> {
		return bcrypt.hash(password, 10);
	}

	private createAccount(accountSave: AccountSave): Account {
		if (!accountSave.username) {
			throw new Error('Username is required');
		}

		const account = new Account({
			id: new ObjectId().toHexString(),
			username: accountSave.username,
		});

		return account;
	}
}
