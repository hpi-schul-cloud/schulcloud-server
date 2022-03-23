import { EntityNotFoundError, InvalidOperationError, ValidationError } from '@shared/common/error';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { Account, EntityId, ICurrentUser, PermissionService, User } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { AccountRepo } from '@shared/repo/account';
import bcrypt from 'bcryptjs';
import { PatchMyAccountParams } from '../controller/dto';

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

	static emailPattern = new RegExp(
		"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$"
	);

	async updateMyAccount(currentUser: ICurrentUser, params: PatchMyAccountParams) {
		let account: Account;
		try {
			account = await this.accountRepo.findByUserId(currentUser.userId);
		} catch (err) {
			throw new EntityNotFoundError('Account');
		}
		if (!params.passwordOld || !account.password || !(await this.checkPassword(params.passwordOld, account.password))) {
			throw new Error('Dein Passwort ist nicht korrekt!');
		}

		let user: User;
		try {
			user = await this.userRepo.findById(currentUser.userId);
		} catch (err) {
			throw new EntityNotFoundError('User');
		}

		let updateUser = false;
		let updateAccount = false;
		if (params.passwordNew) {
			this.checkPasswordStrength(params.passwordNew);
			await this.updatePassword(account, params.passwordNew);
			updateAccount = true;
		}
		if (params.language && user.language !== params.language) {
			// TODO Check if there is an enum or some other fixed values here?
			user.language = params.language;
			updateUser = true;
		}
		if (params.email && user.email !== params.email) {
			this.checkEmailFormat(params.email);
			await this.checkUniqueEmail(account, user, params.email);
			user.email = params.email;
			account.username = params.email;
			updateUser = true;
			updateAccount = true;
		}

		if (params.firstName && user.firstName !== params.firstName) {
			if (!this.hasPermissionsToChangeOwnName(user)) {
				throw new ForbiddenException('No permission to change first name');
			}
			user.firstName = params.firstName;
			updateUser = true;
		}
		if (params.lastName && user.lastName !== params.lastName) {
			if (!this.hasPermissionsToChangeOwnName(user)) {
				throw new ForbiddenException('No permission to change last name');
			}
			user.lastName = params.lastName;
			updateUser = true;
		}

		if (updateUser) {
			await this.userRepo.update(user);
		}
		if (updateAccount) {
			await this.accountRepo.update(account);
		}
	}

	// TODO direct endpoint routing?
	/// this would not allow an administrator to change its own password without forcing a renewal
	async changePassword(currentUserId: EntityId, targetUserId: EntityId, passwordNew: string) {
		if (currentUserId === targetUserId) {
			await this.changeMyTemporaryPassword(currentUserId, passwordNew);
		} else {
			await this.changePasswordForUser(currentUserId, targetUserId, passwordNew);
		}
	}

	async changeMyTemporaryPassword(userId: EntityId, passwordNew: string): Promise<void> {
		let user: User;
		try {
			user = await this.userRepo.findById(userId);
		} catch (err) {
			throw new EntityNotFoundError(User.name);
		}
		const userPreferences = <UserPreferences>user.preferences;

		if (!user.forcePasswordChange && userPreferences.firstLogin) {
			throw new InvalidOperationError('The password is not temporary, hence can not be changed!');
		} // Password change was forces or this is a first logon for the user

		this.checkPasswordStrength(passwordNew);
		let targetAccount: Account;
		try {
			targetAccount = await this.accountRepo.findByUserId(userId);
		} catch (err) {
			throw new EntityNotFoundError(Account.name);
		}

		if (targetAccount.password === undefined || (await this.checkPassword(passwordNew, targetAccount.password))) {
			throw new InvalidOperationError('New password can not be same as old password.');
		}

		await this.updatePassword(targetAccount, passwordNew);
		await this.accountRepo.update(targetAccount);
		user.forcePasswordChange = false;
		await this.userRepo.update(user);
	}

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
		await this.accountRepo.update(targetAccount);
		// set user must change password on next login

		try {
			targetUser.forcePasswordChange = true;
			targetUser = await this.userRepo.update(targetUser);
		} catch (err) {
			throw new EntityNotFoundError('User');
		}

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

	private hasPermissionsToChangeOwnName(currentUser: User) {
		return (
			this.hasRole(currentUser, 'superhero') ||
			this.hasRole(currentUser, 'teacher') ||
			this.hasRole(currentUser, 'administrator')
		);
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

	private async updatePassword(account: Account, password: string): Promise<void> {
		account.password = await bcrypt.hash(password, 10);
	}

	private async checkPassword(enteredPassword: string, hashedAccountPassword: string): Promise<boolean> {
		return bcrypt.compare(enteredPassword, hashedAccountPassword);
	}

	// TODO password helper is used here schulcloud-server\src\services\account\hooks\index.js
	// TODO refactor/remove schulcloud-server\test\helper\passwordHelpers.test.js
	// TODO remove schulcloud-server\src\utils\passwordHelpers.js
	private checkPasswordStrength(password: string) {
		// only check result if also a password was really given
		if (!password || !AccountUc.passwordPattern.test(password)) {
			throw new ValidationError('Dein Passwort stimmt mit dem Pattern nicht überein.');
		}
	}

	// TODO remove in src\utils\constants.js
	private checkEmailFormat(email: string) {
		if (!email || !AccountUc.emailPattern.test(email)) {
			throw new ValidationError('The given email is invalid.');
		}
	}

	private async checkUniqueEmail(account: Account, user: User, email: string): Promise<void> {
		const foundUsers = await this.userRepo.findByEmail(email);
		const foundAccounts = await this.accountRepo.findByUsername(email);

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
