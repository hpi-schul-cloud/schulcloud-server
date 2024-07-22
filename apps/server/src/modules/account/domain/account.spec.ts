import bcrypt from 'bcryptjs';
import { Account } from './account';
import { AccountSave } from './account-save';

describe('Account', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date(2020, 1, 1));
	});

	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	});

	describe('update', () => {
		describe('When updating the account', () => {
			const setup = () => {
				const account = new Account({
					id: 'id',
					username: 'username',
					updatedAt: new Date(),
					createdAt: new Date(),
					userId: 'userId',
					systemId: 'systemId',
					token: 'token',
					credentialHash: 'credentialHash',
					deactivatedAt: new Date(),
				});
				const accountSave = {
					username: 'newUsername',
					systemId: 'newSystemId',
					userId: 'newUserId',
					activated: true,
					expiresAt: new Date(),
					lasttriedFailedLogin: new Date(),
					credentialHash: 'newCredentialHash',
					token: 'newToken',
					deactivatedAt: new Date(),
				} as AccountSave;

				return { account, accountSave };
			};
			it('should update the account', async () => {
				const { account, accountSave } = setup();
				await account.update(accountSave);
				expect(account.getProps()).toStrictEqual({
					username: accountSave.username,
					systemId: accountSave.systemId,
					userId: accountSave.userId,
					activated: accountSave.activated,
					expiresAt: accountSave.expiresAt,
					lasttriedFailedLogin: accountSave.lasttriedFailedLogin,
					credentialHash: accountSave.credentialHash,
					token: accountSave.token,
					id: 'id',
					createdAt: new Date(),
					updatedAt: new Date(),
					deactivatedAt: new Date(),
				});
			});
		});
		describe('When updating the password', () => {
			const setup = () => {
				const account = new Account({
					id: 'id',
					username: 'username',
					updatedAt: new Date(),
					createdAt: new Date(),
					userId: 'userId',
					systemId: 'systemId',
					password: 'password',
					token: 'token',
					credentialHash: 'credentialHash',
				});
				const accountSave = {
					username: 'newUsername',
					systemId: 'newSystemId',
					userId: 'newUserId',
					activated: true,
					expiresAt: new Date(),
					lasttriedFailedLogin: new Date(),
					password: 'newPassword',
					credentialHash: 'newCredentialHash',
					token: 'newToken',
				} as AccountSave;

				return { account, accountSave };
			};
			it('should encrypt Password', async () => {
				const { account, accountSave } = setup();
				await account.update(accountSave);
				const isPasswordMatch = bcrypt.compareSync(accountSave.password ?? '', account.getProps().password ?? '');
				expect(isPasswordMatch).toBe(true);
			});
		});
	});
});
