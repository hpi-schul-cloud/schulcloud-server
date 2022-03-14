import { EntityNotFoundError, ValidationError } from '@shared/common/error';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { Account, EntityId, PermissionService, User } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { AccountRepo } from '@shared/repo/account';
import bcrypt from 'bcryptjs';

type UserPreferences = {
	// first login completed
	firstLogin: boolean;
};

@Injectable()
export class AccountUc {
	constructor(
		private readonly accountRepo: AccountRepo,
		private readonly userRepo: UserRepo,
		private readonly permissionService: PermissionService
	) {}

	static passwordPattern = new RegExp(
		"^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z])(?=.*[\\-_!<>§$%&\\/()=?\\\\;:,.#+*~']).{8,255}$"
	);

	// reset force password change (admin manipulates -> user must change afterwards) unit test
	// first login logic unit test
	// change own password logic unit test
	// password strength unit test

	async changeMyPassword(userId: EntityId, passwordNew: string, passwordOld: string | undefined): Promise<string> {
		this.checkPasswordStrength(passwordNew);

		// if I change my password
		// Check if it is own account

		// const editsOwnAccount = equalIds(hook.id, hook.params.account._id);

		// set forcePasswordChange in user

		const targetUser = await this.userRepo.findById(userId);
		const account = await this.accountRepo.findByUserId(userId);

		const userPreferences = <UserPreferences>targetUser.preferences;

		if (!targetUser.forcePasswordChange || !userPreferences.firstLogin) {
			if (!passwordOld || !account.password || !(await this.checkPassword(passwordOld, account.password)))
				throw new ValidationError('Dein Passwort ist nicht korrekt!');
		}

		await this.updatePassword(account, passwordNew);

		return 'this.accountRepo.update(account);';
	}

	private hasRole(user: User, roleName: string) {
		return user.roles.getItems().some((role) => {
			return role.name === roleName;
		});
	}

	private isDemoUser(currentUser: User) {
		return this.hasRole(currentUser, 'demoStudent') || this.hasRole(currentUser, 'demoTeacher');
	}

	private hasPermissionsToChangePassword(currentUser: User, targetUser: User) {
		if (this.hasRole(currentUser, 'superhero')) {
			return true;
		}
		if (!(currentUser.school.id === targetUser.school.id)) {
			return false;
		}
		if (this.isDemoUser(currentUser)) {
			return false;
		}

		const permissionsToCheck: string[] = [];
		if (this.hasRole(targetUser, 'student')) {
			permissionsToCheck.push('STUDENT_EDIT');
		}
		if (this.hasRole(targetUser, 'teacher')) {
			permissionsToCheck.push('TEACHER_EDIT');
		}
		if (permissionsToCheck.length === 0) {
			// target user is neither student nor teacher. Undefined what to do
			return false;
		}

		return this.permissionService.hasUserAllSchoolPermissions(currentUser, permissionsToCheck);
	}

	// TODO check for demo users (hook "securePatching")
	async changePasswordForUser(currentUserId: EntityId, targetUserId: EntityId, passwordNew: string): Promise<string> {
		this.checkPasswordStrength(passwordNew);

		// load user data
		let targetAccount: Account;
		let currentUser: User;
		let targetUser: User;
		try {
			targetAccount = await this.accountRepo.findByUserId(targetUserId);
		} catch (err) {
			throw new EntityNotFoundError('Account');
		}
		try {
			currentUser = await this.userRepo.findById(currentUserId, true);
			targetUser = await this.userRepo.findById(targetUserId, true);
		} catch (err) {
			throw new EntityNotFoundError('User');
		}

		// check permission
		if (!this.hasPermissionsToChangePassword(currentUser, targetUser)) {
			throw new ForbiddenException("No permission to change this user's password");
		}

		await this.updatePassword(targetAccount, passwordNew);
		// set user must change password on next login
		try {
			targetUser.forcePasswordChange = true;
			targetUser = await this.userRepo.update(targetUser);
		} catch (err) {
			throw new EntityNotFoundError('User');
		}

		return 'this.accountRepo.update(account);';
	}

	private async updatePassword(account: Account, password: string) {
		account.password = await bcrypt.hash(password, 10);
		await this.accountRepo.update(account);
	}

	private async checkPassword(enteredPassword: string, hashedAccountPassword: string) {
		return bcrypt.compare(enteredPassword, hashedAccountPassword);
	}

	// TODO password helper is used here schulcloud-server\src\services\account\hooks\index.js
	// TODO remove schulcloud-server\test\helper\passwordHelpers.test.js
	// TODO remove schulcloud-server\src\utils\passwordHelpers.js
	private checkPasswordStrength(password: string) {
		// only check result if also a password was really given
		if (!password || !AccountUc.passwordPattern.test(password)) {
			throw new ValidationError('Dein Passwort stimmt mit dem Pattern nicht überein.');
		}
	}
}
