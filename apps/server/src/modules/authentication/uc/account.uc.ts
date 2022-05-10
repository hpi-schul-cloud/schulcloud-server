import { Injectable } from '@nestjs/common';
import {
	AuthorizationError,
	EntityNotFoundError,
	ForbiddenOperationError,
	ValidationError,
} from '@shared/common/error';
import { Account, EntityId, ICurrentUser, PermissionService, RoleName, User } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import bcrypt from 'bcryptjs';
import {
	AccountByIdBodyParams,
	AccountByIdParams,
	AccountResponse,
	AccountSearchListResponse,
	AccountSearchQueryParams,
	AccountSearchType,
	PatchMyAccountParams,
} from '../controller/dto';
import { AccountResponseMapper } from '../mapper/account-response.mapper';
import { AccountService } from '../services/account.service';
import { AccountDto } from '../services/dto/account.dto';

type UserPreferences = {
	// first login completed
	firstLogin: boolean;
};

@Injectable()
export class AccountUc {
	constructor(
		private readonly accountService: AccountService,
		private readonly userRepo: UserRepo,
		private readonly permissionService: PermissionService
	) {}

	/**
	 * This method processes the request on the GET account search endpoint from the account controller.
	 *
	 * @param currentUser the request user
	 * @param query the request query
	 * @throws {ValidationError}
	 * @throws {ForbiddenOperationError}
	 * @throws {EntityNotFoundError}
	 */
	async searchAccounts(currentUser: ICurrentUser, query: AccountSearchQueryParams): Promise<AccountSearchListResponse> {
		const skip = query.skip ?? 0;
		const limit = query.limit ?? 10;

		if (!(await this.isSuperhero(currentUser))) {
			throw new ForbiddenOperationError('Current user is not authorized to search for accounts.');
		}

		switch (query.type) {
			case AccountSearchType.USER_ID:
				// eslint-disable-next-line no-case-declarations
				const account = await this.accountService.findByUserId(query.value);
				if (account) {
					return new AccountSearchListResponse([AccountResponseMapper.mapToResponse(account)], 1, 0, 1);
				}
				return new AccountSearchListResponse([], 0, 0, 0);
			case AccountSearchType.USERNAME:
				// eslint-disable-next-line no-case-declarations
				const { accounts, total } = await this.accountService.searchByUsernamePartialMatch(query.value, skip, limit);
				// eslint-disable-next-line no-case-declarations
				const accountList = accounts.map((tempAccount) => AccountResponseMapper.mapToResponse(tempAccount));
				return new AccountSearchListResponse(accountList, total, skip, limit);
			default:
				throw new ValidationError('Invalid search type.');
		}
	}

	/**
	 * This method processes the request on the GET account with id endpoint from the account controller.
	 *
	 * @param currentUser the request user
	 * @param params the request parameters
	 * @throws {ForbiddenOperationError}
	 * @throws {EntityNotFoundError}
	 */
	async findAccountById(currentUser: ICurrentUser, params: AccountByIdParams): Promise<AccountResponse> {
		if (!(await this.isSuperhero(currentUser))) {
			throw new ForbiddenOperationError('Current user is not authorized to search for accounts.');
		}
		const account = await this.accountService.findById(params.id);
		return AccountResponseMapper.mapToResponse(account);
	}

	/**
	 * This method processes the request on the PATCH account with id endpoint from the account controller.
	 *
	 * @param currentUser the request user
	 * @param params the request parameters
	 * @param body the request body
	 * @throws {ForbiddenOperationError}
	 * @throws {EntityNotFoundError}
	 */
	async updateAccountById(
		currentUser: ICurrentUser,
		params: AccountByIdParams,
		body: AccountByIdBodyParams
	): Promise<AccountResponse> {
		const executingUser = await this.userRepo.findById(currentUser.userId, true);
		const targetAccount = await this.accountService.findById(params.id);
		const targetUser = await this.userRepo.findById(targetAccount.userId, true);

		let updateUser = false;
		let updateAccount = false;

		if (!this.hasPermissionsToUpdateAccount(executingUser, targetUser)) {
			throw new ForbiddenOperationError('Current user is not authorized to update target account.');
		}
		if (body.password !== undefined) {
			targetAccount.password = await this.calcPasswordHash(body.password);
			targetUser.forcePasswordChange = true;
			updateUser = true;
			updateAccount = true;
		}
		if (body.username !== undefined) {
			const newMail = body.username.toLowerCase();
			await this.checkUniqueEmail(targetAccount, targetUser, newMail);
			targetUser.email = newMail;
			targetAccount.username = newMail;
			updateUser = true;
			updateAccount = true;
		}
		if (body.activated !== undefined) {
			targetAccount.activated = body.activated;
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
				await this.accountService.save(targetAccount);
			} catch (err) {
				throw new EntityNotFoundError(Account.name);
			}
		}
		return AccountResponseMapper.mapToResponse(targetAccount);
	}

	/**
	 * This method processes the request on the DELETE account with id endpoint from the account controller.
	 *
	 * @param currentUser the request user
	 * @param params the request parameters
	 * @throws {ForbiddenOperationError}
	 * @throws {EntityNotFoundError}
	 */
	async deleteAccountById(currentUser: ICurrentUser, params: AccountByIdParams): Promise<AccountResponse> {
		if (!(await this.isSuperhero(currentUser))) {
			throw new ForbiddenOperationError('Current user is not authorized to delete an account.');
		}
		const account: AccountDto = await this.accountService.findById(params.id);
		await this.accountService.delete(account);
		return AccountResponseMapper.mapToResponse(account);
	}

	/**
	 * This method allows to update my (currentUser) account details.
	 *
	 * @param currentUserId the current user
	 * @param params account details
	 */
	async updateMyAccount(currentUserId: EntityId, params: PatchMyAccountParams) {
		const account: AccountDto = await this.accountService.findByUserIdOrFail(currentUserId);

		if (account.systemId) {
			throw new ForbiddenOperationError('External account details can not be changed.');
		}

		if (!params.passwordOld || !account.password || !(await this.checkPassword(params.passwordOld, account.password))) {
			throw new AuthorizationError('Dein Passwort ist nicht korrekt!');
		}

		let user: User;
		try {
			user = await this.userRepo.findById(currentUserId, true);
		} catch (err) {
			throw new EntityNotFoundError('User');
		}

		let updateUser = false;
		let updateAccount = false;
		if (params.passwordNew) {
			account.password = await this.calcPasswordHash(params.passwordNew);
			updateAccount = true;
		}
		if (params.email && user.email !== params.email) {
			const newMail = params.email.toLowerCase();
			await this.checkUniqueEmail(account, user, newMail);
			user.email = newMail;
			account.username = newMail;
			updateUser = true;
			updateAccount = true;
		}

		if (params.firstName && user.firstName !== params.firstName) {
			if (!this.hasPermissionsToChangeOwnName(user)) {
				throw new ForbiddenOperationError('No permission to change first name');
			}
			user.firstName = params.firstName;
			updateUser = true;
		}
		if (params.lastName && user.lastName !== params.lastName) {
			if (!this.hasPermissionsToChangeOwnName(user)) {
				throw new ForbiddenOperationError('No permission to change last name');
			}
			user.lastName = params.lastName;
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
				await this.accountService.save(account);
			} catch (err) {
				throw new EntityNotFoundError(Account.name);
			}
		}
	}

	/**
	 * This method is used to replace my (currentUser) temporary password.
	 * Callable when the current user's password was force set or this is the first login.
	 *
	 * @param userId the current user
	 * @param password the new password
	 * @param confirmPassword the new password (has to match password)
	 */
	async replaceMyTemporaryPassword(userId: EntityId, password: string, confirmPassword: string): Promise<void> {
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

		if (!user.forcePasswordChange && userPreferences.firstLogin) {
			throw new ForbiddenOperationError('The password is not temporary, hence can not be changed.');
		} // Password change was forces or this is a first logon for the user

		const account: AccountDto = await this.accountService.findByUserIdOrFail(userId);

		if (account.systemId) {
			throw new ForbiddenOperationError('External account details can not be changed.');
		}

		if (!account.password) {
			throw new Error('The account does not have a password to compare against.');
		} else if (await this.checkPassword(password, account.password)) {
			throw new ForbiddenOperationError('New password can not be same as old password.');
		}

		try {
			account.password = await this.calcPasswordHash(password);
			await this.accountService.save(account);
		} catch (err) {
			throw new EntityNotFoundError(Account.name);
		}
		try {
			user.forcePasswordChange = false;
			await this.userRepo.save(user);
		} catch (err) {
			throw new EntityNotFoundError(User.name);
		}
	}

	private hasRole(user: User, roleName: string) {
		return user.roles.getItems().some((role) => {
			return role.name === roleName;
		});
	}

	private async isSuperhero(currentUser: ICurrentUser): Promise<boolean> {
		const user = await this.userRepo.findById(currentUser.userId, true);
		return user.roles.getItems().some((role) => role.name === RoleName.SUPERHERO);
	}

	private hasPermissionsToChangeOwnName(currentUser: User) {
		return (
			this.hasRole(currentUser, 'superhero') ||
			this.hasRole(currentUser, 'teacher') ||
			this.hasRole(currentUser, 'administrator')
		);
	}

	private hasPermissionsToUpdateAccount(currentUser: User, targetUser: User) {
		if (this.hasRole(currentUser, RoleName.SUPERHERO)) {
			return true;
		}
		if (!(currentUser.school.id === targetUser.school.id)) {
			return false;
		}

		const permissionsToCheck: string[] = [];
		if (this.hasRole(targetUser, RoleName.STUDENT)) {
			permissionsToCheck.push('STUDENT_EDIT');
		}
		if (this.hasRole(targetUser, RoleName.TEACHER)) {
			permissionsToCheck.push('TEACHER_EDIT');
		}
		if (permissionsToCheck.length === 0) {
			// target user is neither student nor teacher. Undefined what to do
			return false;
		}

		return this.permissionService.hasUserAllSchoolPermissions(currentUser, permissionsToCheck);
	}

	private calcPasswordHash(password: string): Promise<string> {
		return bcrypt.hash(password, 10);
	}

	private async checkPassword(enteredPassword: string, hashedAccountPassword: string) {
		return bcrypt.compare(enteredPassword, hashedAccountPassword);
	}

	private async checkUniqueEmail(account: AccountDto, user: User, email: string): Promise<void> {
		const [foundUsers, { accounts: foundAccounts }] = await Promise.all([
			this.userRepo.findByEmail(email),
			this.accountService.searchByUsernameExactMatch(email),
		]);

		if (
			foundUsers.length > 1 ||
			foundAccounts.length > 1 ||
			(foundUsers.length === 1 && foundUsers[0].id !== user.id) ||
			(foundAccounts.length === 1 && foundAccounts[0].id !== account.id)
		) {
			throw new ValidationError(`Die E-Mail Adresse ist bereits in Verwendung!`);
		}
	}
}
