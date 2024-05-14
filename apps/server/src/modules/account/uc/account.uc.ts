import { ICurrentUser } from '@modules/authentication';
import { AuthorizationService } from '@modules/authorization';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityNotFoundError, ValidationError } from '@shared/common/error';
import { Role, SchoolEntity, User } from '@shared/domain/entity';
import { Permission, RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { AccountService } from '..';
import { AccountSearchType } from '../controller/dto';
import { Account, AccountSave, UpdateAccount, UpdateMyAccount } from '../domain';
import {
	AccountSearchDto,
	ResolvedAccountDto,
	ResolvedSearchListAccountDto,
	UpdateAccountDto,
	UpdateMyAccountDto,
} from './dto';
import { AccountUcMapper } from './mapper/account-uc.mapper';

@Injectable()
export class AccountUc {
	constructor(
		private readonly accountService: AccountService,
		private readonly authorizationService: AuthorizationService
	) {}

	/**
	 * This method processes the request on the GET account search endpoint from the account controller.
	 *
	 * @param currentUser the request user
	 * @param search the search request
	 * @throws {ValidationError}
	 * @throws {ForbiddenOperationError}
	 */
	public async searchAccounts(
		currentUser: ICurrentUser,
		search: AccountSearchDto
	): Promise<ResolvedSearchListAccountDto> {
		const executingUser: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);

		switch (search.type) {
			case AccountSearchType.USERNAME:
				return this.searchByUsername(executingUser, search.value, search.skip, search.limit);
			case AccountSearchType.USER_ID:
				return this.searchByUserId(executingUser, search.value, search.skip, search.limit);
			default:
				throw new ValidationError('Invalid search type.');
		}
	}

	private async searchByUsername(
		executingUser: User,
		usernameQuery: string,
		skip?: number,
		limit?: number
	): Promise<ResolvedSearchListAccountDto> {
		this.authorizationService.checkAllPermissions(executingUser, [Permission.ACCOUNT_VIEW]);

		const searchDoCounted = await this.accountService.searchByUsernamePartialMatch(
			usernameQuery,
			skip ?? 0,
			limit ?? 10
		);
		const [searchResult, total] = AccountUcMapper.mapSearchResult(searchDoCounted);

		return new ResolvedSearchListAccountDto(searchResult, total, skip ?? 0, limit ?? 10);
	}

	private async searchByUserId(
		executingUser: User,
		targetUserId: string,
		skip?: number,
		limit?: number
	): Promise<ResolvedSearchListAccountDto> {
		const targetUser = await this.authorizationService.getUserWithPermissions(targetUserId);
		const permission = this.hasPermissionsToAccessAccount(executingUser, targetUser, 'READ');
		if (!permission) {
			throw new UnauthorizedException('Current user is not authorized to search for accounts by user id.');
		}

		const account = await this.accountService.findByUserId(targetUserId);

		if (account) {
			return new ResolvedSearchListAccountDto(
				[AccountUcMapper.mapToResolvedAccountDto(account)],
				1,
				skip ?? 0,
				limit ?? 1
			);
		}
		return new ResolvedSearchListAccountDto([], 0, skip ?? 0, limit ?? 0);
	}

	/**
	 * This method processes the request on the GET account with id endpoint from the account controller.
	 *
	 * @param currentUser the request user
	 * @param accountId the account id
	 * @throws {ForbiddenOperationError}
	 * @throws {EntityNotFoundError}
	 */
	public async findAccountById(currentUser: ICurrentUser, accountId: string): Promise<ResolvedAccountDto> {
		const user = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.ACCOUNT_VIEW]);

		const account = await this.accountService.findById(accountId);

		return AccountUcMapper.mapToResolvedAccountDto(account);
	}

	/**
	 * Saves the given account with validation.
	 *
	 * @param accountSave the account to save
	 */
	public async saveAccount(accountSave: AccountSave): Promise<void> {
		await this.accountService.saveWithValidation(accountSave);
	}

	/**
	 * This method processes the request on the PATCH account with id endpoint from the account controller.
	 *
	 * @param currentUser the request user
	 * @param accountId the account id
	 * @param updateDto the update request
	 * @throws {ForbiddenOperationError}
	 * @throws {EntityNotFoundError}
	 */
	public async updateAccountById(
		currentUser: ICurrentUser,
		accountId: string,
		updateDto: UpdateAccountDto
	): Promise<ResolvedAccountDto> {
		const executingUser = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		const targetAccount = await this.accountService.findById(accountId);

		if (!targetAccount.userId) {
			throw new EntityNotFoundError(User.name);
		}

		const targetUser = await this.authorizationService.getUserWithPermissions(targetAccount.userId);

		if (!this.hasPermissionsToAccessAccount(executingUser, targetUser, 'UPDATE')) {
			throw new UnauthorizedException('Current user is not authorized to update target account.');
		}

		const updateData = new UpdateAccount(updateDto);
		const updated: Account = await this.accountService.updateAccount(targetUser, targetAccount, updateData);

		return AccountUcMapper.mapToResolvedAccountDto(updated);
	}

	/**
	 * This method processes the request on the DELETE account with id endpoint from the account controller.
	 *
	 * @param currentUser the request user
	 * @param accountId the account id
	 * @throws {ForbiddenOperationError}
	 * @throws {EntityNotFoundError}
	 */
	public async deleteAccountById(currentUser: ICurrentUser, accountId: string): Promise<ResolvedAccountDto> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.ACCOUNT_DELETE]);

		const account: Account = await this.accountService.findById(accountId);

		await this.accountService.delete(account.id);
		return AccountUcMapper.mapToResolvedAccountDto(account);
	}

	/**
	 * This method allows to update my (currentUser) account details.
	 *
	 * @param currentUserId the current user
	 * @param updateMyAccountDto account details
	 */
	public async updateMyAccount(currentUserId: EntityId, updateMyAccountDto: UpdateMyAccountDto) {
		const user = await this.authorizationService.getUserWithPermissions(currentUserId);
		if (
			(updateMyAccountDto.firstName && user.firstName !== updateMyAccountDto.firstName) ||
			(updateMyAccountDto.lastName && user.lastName !== updateMyAccountDto.lastName)
		) {
			this.authorizationService.checkAllPermissions(user, [Permission.USER_CHANGE_OWN_NAME]);
		}

		const account: Account = await this.accountService.findByUserIdOrFail(currentUserId);
		const updateData = new UpdateMyAccount(updateMyAccountDto);

		await this.accountService.updateMyAccount(user, account, updateData);
	}

	/**
	 * This method is used to replace my (currentUser) temporary password.
	 * Callable when the current user's password was force set or this is the first login.
	 *
	 * @param userId the current user
	 * @param password the new password
	 * @param confirmPassword the new password (has to match password)
	 */
	public async replaceMyTemporaryPassword(userId: EntityId, password: string, confirmPassword: string): Promise<void> {
		await this.accountService.replaceMyTemporaryPassword(userId, password, confirmPassword);
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
			this.authorizationService.hasAllPermissions(currentUser, permissionsToCheck) ||
			this.schoolPermissionExists(
				this.extractRoles(currentUser.roles.getItems()),
				currentUser.school,
				permissionsToCheck
			)
		);
	}

	private hasRole(user: User, roleName: string) {
		return user.roles.getItems().some((role) => role.name === roleName);
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
