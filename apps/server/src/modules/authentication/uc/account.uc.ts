import { Injectable } from '@nestjs/common';
import { EntityNotFoundError, ValidationError } from '@shared/common/error';
import { Account, EntityId, User } from '@shared/domain';
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

	// findOneById(accountId: EntityId): Promise<Account> {
	// 	return this.accountRepo.read(accountId);
	// }

	// create(account: Account): Promise<Account> {
	// 	return this.accountRepo.create(account);
	// }

	// update(account: Account): Promise<Account> {
	// 	return this.accountRepo.update(account);
	// }

	// remove(accountId: EntityId): Promise<Account> {
	// 	return this.accountRepo.delete(accountId);
	// }

	// permissions

	// force password change (admin manipulates -> user must change afterwards) unit test
	// first login logic unit test
	// change own password logic unit test
	// password strength unit test

	async changeMyPassword(userId: EntityId, passwordNew: string, passwordOld: string | undefined): Promise<string> {
		this.checkPasswordStrength(passwordNew);

		// if I change my password
		// Check if it is own account
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
		let account: Account;
		try {
			account = await this.accountRepo.findByUserId(userId);
			await this.updatePassword(account, passwordNew);
		} catch (err) {
			throw new EntityNotFoundError('Account');
		}

		// set user must change password on next login
		let user: User;
		try {
			user = await this.userRepo.findById(userId);
			user.forcePasswordChange = true;
			await this.userRepo.update(user);
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
