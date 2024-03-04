import { AccountService } from '@modules/account/services/account.service';
import { AccountDto } from '@modules/account/services/dto/account.dto';
import { ICurrentUser } from '@modules/authentication';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	AuthorizationError,
	EntityNotFoundError,
	ForbiddenOperationError,
	ValidationError,
} from '@shared/common/error';
import { Account, Role, SchoolEntity, User } from '@shared/domain/entity';
import { Permission, RoleName } from '@shared/domain/interface';
import { PermissionService } from '@shared/domain/service';
import { EntityId } from '@shared/domain/types';
import { UserRepo } from '@shared/repo';
import { BruteForcePrevention } from '@src/imports-from-feathers';
import { ObjectId } from 'bson';
import { AccountConfig } from '../account-config';
import {
	AccountByIdBodyParams,
	AccountByIdParams,
	AccountResponse,
	AccountSearchListResponse,
	AccountSearchQueryParams,
	AccountSearchType,
	PatchMyAccountParams,
} from '../controller/dto';
import { AccountResponseMapper } from '../mapper';
import { AccountValidationService } from '../services/account.validation.service';
import { AccountSaveDto } from '../services/dto';

type UserPreferences = {
	// first login completed
	firstLogin: boolean;
};
@Injectable()
export class AccountUc {
	constructor(
		private readonly accountService: AccountService,
		private readonly userRepo: UserRepo,
		private readonly permissionService: PermissionService,
		private readonly accountValidationService: AccountValidationService,
		private readonly configService: ConfigService<AccountConfig, true>
	) {}

	/**
	 * This method processes the request on the GET account search endpoint from the account controller.
	 *
	 * @param currentUser the request user
	 * @param query the request query
	 * @throws {ValidationError}
	 * @throws {ForbiddenOperationError}
	 */
	async searchAccounts(currentUser: ICurrentUser, query: AccountSearchQueryParams): Promise<AccountSearchListResponse> {
		const skip = query.skip ?? 0;
		const limit = query.limit ?? 10;
		const executingUser = await this.userRepo.findById(currentUser.userId, true);

		if (query.type === AccountSearchType.USERNAME) {
			if (!(await this.isSuperhero(currentUser))) {
				throw new ForbiddenOperationError('Current user is not authorized to search for accounts.');
			}
			const [accounts, total] = await this.accountService.searchByUsernamePartialMatch(query.value, skip, limit);
			const accountList = accounts.map((tempAccount) => AccountResponseMapper.mapToResponse(tempAccount));
			return new AccountSearchListResponse(accountList, total, skip, limit);
		}
		if (query.type === AccountSearchType.USER_ID) {
			const targetUser = await this.userRepo.findById(query.value, true);
			const permission = this.hasPermissionsToAccessAccount(executingUser, targetUser, 'READ');

			if (!permission) {
				throw new ForbiddenOperationError('Current user is not authorized to search for accounts by user id.');
			}
			const account = await this.accountService.findByUserId(query.value);
			if (account) {
				return new AccountSearchListResponse([AccountResponseMapper.mapToResponse(account)], 1, 0, 1);
			}
			return new AccountSearchListResponse([], 0, 0, 0);
		}

		throw new ValidationError('Invalid search type.');
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

	async saveAccount(dto: AccountSaveDto): Promise<void> {
		await this.accountService.saveWithValidation(dto);
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

		if (!targetAccount.userId) {
			throw new EntityNotFoundError(User.name);
		}

		const targetUser = await this.userRepo.findById(targetAccount.userId, true);

		let updateUser = false;
		let updateAccount = false;

		if (!this.hasPermissionsToAccessAccount(executingUser, targetUser, 'UPDATE')) {
			throw new ForbiddenOperationError('Current user is not authorized to update target account.');
		}
		if (body.password !== undefined) {
			targetAccount.password = body.password;
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
		await this.accountService.delete(account.id);
		return AccountResponseMapper.mapToResponse(account);
	}

	/**
	 * This method allows to update my (currentUser) account details.
	 *
	 * @param currentUserId the current user
	 * @param params account details
	 */
	async updateMyAccount(currentUserId: EntityId, params: PatchMyAccountParams) {
		const user = await this.userRepo.findById(currentUserId, true);
		const account: AccountDto = await this.accountService.findByUserIdOrFail(currentUserId);

		if (account.systemId) {
			throw new ForbiddenOperationError('External account details can not be changed.');
		}

		if (!params.passwordOld || !(await this.accountService.validatePassword(account, params.passwordOld))) {
			throw new AuthorizationError('Dein Passwort ist nicht korrekt!');
		}

		let updateUser = false;
		let updateAccount = false;
		if (params.passwordNew) {
			account.password = params.passwordNew;
			updateAccount = true;
		} else {
			account.password = undefined;
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
		const firstLoginPassed = userPreferences ? userPreferences.firstLogin : false;

		if (!user.forcePasswordChange && firstLoginPassed) {
			throw new ForbiddenOperationError('The password is not temporary, hence can not be changed.');
		} // Password change was forces or this is a first logon for the user

		const account: AccountDto = await this.accountService.findByUserIdOrFail(userId);

		if (account.systemId) {
			throw new ForbiddenOperationError('External account details can not be changed.');
		}

		if (await this.accountService.validatePassword(account, password)) {
			throw new ForbiddenOperationError('New password can not be same as old password.');
		}

		try {
			account.password = password;
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

	/**
	 *
	 * @deprecated this is for legacy login strategies only. Login strategies in Nest.js should use {@link AuthenticationService}
	 */
	async checkBrutForce(username: string, systemId: EntityId | ObjectId): Promise<void> {
		const account = await this.accountService.findByUsernameAndSystemId(username, systemId);
		//  missing Account is ignored as in legacy feathers Impl.
		if (account) {
			if (account.lasttriedFailedLogin) {
				const timeDifference = (new Date().getTime() - account.lasttriedFailedLogin.getTime()) / 1000;
				if (timeDifference < this.configService.get<number>('LOGIN_BLOCK_TIME')) {
					throw new BruteForcePrevention('Brute Force Prevention!', {
						timeToWait: this.configService.get<number>('LOGIN_BLOCK_TIME') - Math.ceil(timeDifference),
					});
				}
			}
			await this.accountService.updateLastTriedFailedLogin(account.id, new Date());
		}
	}

	private async checkUniqueEmail(account: AccountDto, user: User, email: string): Promise<void> {
		if (!(await this.accountValidationService.isUniqueEmail(email, user.id, account.id, account.systemId))) {
			throw new ValidationError(`The email address is already in use!`);
		}
	}

	private hasRole(user: User, roleName: string) {
		return user.roles.getItems().some((role) => role.name === roleName);
	}

	private async isSuperhero(currentUser: ICurrentUser): Promise<boolean> {
		const user = await this.userRepo.findById(currentUser.userId, true);
		return user.roles.getItems().some((role) => role.name === RoleName.SUPERHERO);
	}

	private hasPermissionsToChangeOwnName(currentUser: User) {
		return (
			this.hasRole(currentUser, RoleName.SUPERHERO) ||
			this.hasRole(currentUser, RoleName.TEACHER) ||
			this.hasRole(currentUser, RoleName.ADMINISTRATOR)
		);
	}

	private hasPermissionsToAccessAccount(
		currentUser: User,
		targetUser: User,
		action: 'READ' | 'UPDATE' | 'DELETE' | 'CREATE'
	) {
		if (this.hasRole(currentUser, RoleName.SUPERHERO)) {
			return true;
		}
		if (!(currentUser.school.id === targetUser.school.id)) {
			return false;
		}

		const permissionsToCheck: string[] = [];
		if (this.hasRole(targetUser, RoleName.STUDENT)) {
			// eslint-disable-next-line default-case
			switch (action) {
				case 'READ':
					permissionsToCheck.push(Permission.STUDENT_LIST);
					break;
				case 'UPDATE':
					permissionsToCheck.push(Permission.STUDENT_EDIT);
					break;
				// for future endpoints
				/* case 'CREATE':
					permissionsToCheck.push('STUDENT_CREATE');
					break;
				case 'DELETE':
					permissionsToCheck.push('STUDENT_DELETE');
					break;
				*/
			}
		}
		if (this.hasRole(targetUser, RoleName.TEACHER)) {
			// eslint-disable-next-line default-case
			switch (action) {
				case 'READ':
					permissionsToCheck.push(Permission.TEACHER_LIST);
					break;
				case 'UPDATE':
					permissionsToCheck.push(Permission.TEACHER_EDIT);
					break;
				// for future endpoints
				/* case 'CREATE':
					permissionsToCheck.push('TEACHER_CREATE');
					break;
				case 'DELETE':
					permissionsToCheck.push('TEACHER_DELETE');
					break;
 				*/
			}
		}
		if (permissionsToCheck.length === 0) {
			// target user is neither student nor teacher. Undefined what to do
			return false;
		}

		return (
			this.permissionService.hasUserAllSchoolPermissions(currentUser, permissionsToCheck) ||
			this.schoolPermissionExists(
				this.extractRoles(currentUser.roles.getItems()),
				currentUser.school,
				permissionsToCheck
			)
		);
	}

	private schoolPermissionExists(roles: string[], school: SchoolEntity, permissions: string[]): boolean {
		if (
			roles.find((role) => role === RoleName.TEACHER) &&
			permissions.find((permission) => permission === Permission.STUDENT_LIST)
		) {
			return school.permissions?.teacher?.STUDENT_LIST ?? false;
		}

		return false;
	}

	private extractRoles(inputRoles: Role[]): string[] {
		const roles: string[] = [];

		for (let i = 0; i < inputRoles.length; i += 1) {
			const role = inputRoles[i];
			roles.push(role.name);
			const innerRoles = role.roles.getItems().map((x) => x.name);
			roles.push(...innerRoles);
		}

		return roles;
	}
}
