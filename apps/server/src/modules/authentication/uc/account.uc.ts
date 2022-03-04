import { Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common/error';
import { Account, EntityId } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { AccountRepo } from '@shared/repo/account';
import bcrypt from 'bcryptjs';

type UserPreferences = {
	// first login completed
	firstLogin: boolean;
};

@Injectable()
export class AccountUc {
	constructor(private readonly accountRepo: AccountRepo, private readonly userRepo: UserRepo) {}

	static passwordPattern = new RegExp(
		"^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z])(?=.*[\\-_!<>§$%&\\/()=?\\\\;:,.#+*~']).{8,255}$"
	);

	findOneById(accountId: EntityId): Promise<Account> {
		return this.accountRepo.read(accountId);
	}

	// create(account: Account): Promise<Account> {
	// 	return this.accountRepo.create(account);
	// }

	// update(account: Account): Promise<Account> {
	// 	return this.accountRepo.update(account);
	// }

	remove(accountId: EntityId): Promise<Account> {
		return this.accountRepo.delete(accountId);
	}

	// permissions

	// force password change (admin manipulates -> user must change afterwards) unit test
	// first login logic unit test
	// change own password logic unit test
	// password strength unit test

	async changeMyPassword(userId: EntityId, passwordNew: string, passwordOld: string | undefined): Promise<string> {
		this.checkPasswordStrength(passwordNew);

		// if I change my password
		// Check if it is own account
		// const editsOwnAccount = equalIds(hook.id, hook.params.account._id);

		// set forcePasswordChange in user

		const user = await this.userRepo.findById(userId);
		const account = await this.accountRepo.findByUserId(userId);

		const userPreferences = <UserPreferences>user.preferences;

		if (!user.forcePasswordChange || !userPreferences.firstLogin) {
			if (!passwordOld || !account.password || !(await this.checkPassword(passwordOld, account.password)))
				throw new ValidationError('Dein Passwort ist nicht korrekt!');
		}

		await this.updatePassword(account, passwordNew);

		return 'this.accountRepo.update(account);';
	}

	async changePasswordForUser(userId: EntityId, passwordNew: string): Promise<string> {
		this.checkPasswordStrength(passwordNew);

		// check permission
		// user rights
		// globalHooks.hasPermissionNoHook(hook, hook.params.account.userId, 'STUDENT_EDIT'),
		// globalHooks.hasRoleNoHook(hook, hook.id, 'student', true),
		// globalHooks.hasPermissionNoHook(hook, hook.params.account.userId, 'ADMIN_VIEW'),
		// globalHooks.hasRoleNoHook(hook, hook.id, 'teacher', true),
		// globalHooks.hasRole(hook, hook.params.account.userId, 'superhero'),
		// hook.app.service('users').get(hook.params.account.userId),
		// [hasStudentCreate, isStudent, hasAdminView, isTeacher, isSuperHero, user]

		// only check result if also a password was really given
		// if (!patternResult && password) {
		//	throw new BadRequest('Dein Passwort stimmt mit dem Pattern nicht überein.');
		// }

		const account = await this.accountRepo.findByUserId(userId);

		// TODO check user rights, password pattern,...
		await this.updatePassword(account, passwordNew);

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
		if (password || !AccountUc.passwordPattern.test(password)) {
			throw new ValidationError('Dein Passwort stimmt mit dem Pattern nicht überein.');
		}
	}
}
