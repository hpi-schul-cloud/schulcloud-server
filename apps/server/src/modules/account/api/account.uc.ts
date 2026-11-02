import { ICurrentUser } from '@infra/auth-guard';
import { AuthorizationService } from '@modules/authorization';
import { RoleName } from '@modules/role';
import { User } from '@modules/user/repo';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common/error';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Account, AccountSave, AccountService, UpdateAccount, UpdateMyAccount } from '../domain';
import { ResolvedAccountDto, UpdateAccountDto, UpdateMyAccountDto } from './dto';
import { AccountUcMapper } from './mapper/account-uc.mapper';

@Injectable()
export class AccountUc {
	constructor(
		private readonly accountService: AccountService,
		private readonly authorizationService: AuthorizationService
	) {}

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
			throw new EntityNotFoundError('User');
		}

		const targetUser = await this.authorizationService.getUserWithPermissions(targetAccount.userId);

		if (!this.hasPermissionsToAccessAccount(executingUser, targetUser)) {
			throw new UnauthorizedException('Current user is not authorized to update target account.');
		}

		const updateData = new UpdateAccount(updateDto);
		const updated: Account = await this.accountService.updateAccount(targetUser, targetAccount, updateData);

		return AccountUcMapper.mapToResolvedAccountDto(updated);
	}

	/**
	 * This method allows to update my (currentUser) account details.
	 *
	 * @param currentUserId the current user
	 * @param updateMyAccountDto account details
	 */
	public async updateMyAccount(currentUserId: EntityId, updateMyAccountDto: UpdateMyAccountDto): Promise<void> {
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

	private hasPermissionsToAccessAccount(currentUser: User, targetUser: User): boolean {
		if (this.hasRole(currentUser, RoleName.SUPERHERO)) {
			return true;
		}
		if (currentUser.school.id !== targetUser.school.id) {
			return false;
		}

		const permissionsToCheck: Permission[] = [];
		if (this.hasRole(targetUser, RoleName.STUDENT)) {
			permissionsToCheck.push(Permission.STUDENT_EDIT);
		}
		if (this.hasRole(targetUser, RoleName.TEACHER)) {
			permissionsToCheck.push(Permission.TEACHER_EDIT);
		}
		if (permissionsToCheck.length === 0) {
			// target user is neither student nor teacher. Undefined what to do
			return false;
		}

		return this.authorizationService.hasAllPermissions(currentUser, permissionsToCheck);
	}

	private hasRole(user: User, roleName: RoleName): boolean {
		return user.roles.getItems().some((role) => role.name === roleName);
	}
}
