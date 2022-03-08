import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { Account, EntityId, User } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { AccountRepo } from '@shared/repo/account';
import { accountFactory, setupEntities } from '@shared/testing';
import { AccountUc } from './account.uc';

describe('AccountUc', () => {
	let module: TestingModule;
	let accountUc: AccountUc;
	let orm: MikroORM;
	let mockAccount: Account;

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AccountUc,
				{
					provide: AccountRepo,
					useValue: {
						create: (): Promise<Account> => {
							return Promise.resolve(mockAccount);
						},
						read: (): Promise<Account> => {
							return Promise.resolve(mockAccount);
						},
						update: (): Promise<Account> => {
							return Promise.resolve(mockAccount);
						},
						delete: (): Promise<Account> => {
							return Promise.resolve(mockAccount);
						},
						findByUserId: (userId: EntityId): Promise<Account> => {
							if (userId === mockAccount.user.id || userId === 'account') {
								return Promise.resolve(mockAccount);
							}
							throw Error();
						},
					},
				},
				{
					provide: UserRepo,
					useValue: {
						findById: (userId: EntityId): Promise<User> => {
							if (userId === mockAccount.user.id || userId === 'user') {
								return Promise.resolve(mockAccount.user);
							}
							throw Error();
						},
						update: (): Promise<User> => {
							return Promise.resolve(mockAccount.user);
						},
					},
				},
			],
		}).compile();

		accountUc = module.get(AccountUc);
		orm = await setupEntities();
		mockAccount = accountFactory.buildWithId();
	});

	describe('changePasswordForUser', () => {
		it('should throw if account does not exist', async () => {
			await expect(accountUc.changePasswordForUser('user', 'DummyPasswd!1')).rejects.toThrow(EntityNotFoundError);
		});

		it('should throw if user does not exist', async () => {
			await expect(accountUc.changePasswordForUser('account', 'DummyPasswd!1')).rejects.toThrow(EntityNotFoundError);
		});

		it('should throw if password is weak', async () => {
			await expect(accountUc.changePasswordForUser(mockAccount.user.id, 'weak')).rejects.toThrow();
		});

		it('should accept strong password, update it and force renewal', async () => {
			const previousPasswordHash = mockAccount.password;
			expect(mockAccount.user.forcePasswordChange).toBeFalsy();
			await accountUc.changePasswordForUser(mockAccount.user.id, 'DummyPasswd!1');
			expect(mockAccount.password).not.toBe(previousPasswordHash);
			expect(mockAccount.user.forcePasswordChange).toBe(true);
		});

		// TODO check authentification / authorization
	});
});
