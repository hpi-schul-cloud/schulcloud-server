import { MikroORM } from '@mikro-orm/core';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationError, EntityNotFoundError, ForbiddenOperationError, ValidationError } from '@shared/common';
import { Account, EntityId, PermissionService, Role, School, User } from '@shared/domain';
import { AccountRepo, UserRepo } from '@shared/repo';
import { accountFactory, schoolFactory, setupEntities, userFactory } from '@shared/testing';
import { AccountUc } from './account.uc';

describe('AccountUc', () => {
	let module: TestingModule;
	let accountUc: AccountUc;
	let userRepo: UserRepo;
	let accountRepo: AccountRepo;
	let orm: MikroORM;

	let mockSchool: School;
	let mockOtherSchool: School;

	let mockSuperheroUser: User;
	let mockAdminUser: User;
	let mockTeacherUser: User;
	let mockDemoTeacherUser: User;
	let mockDemoStudentUser: User;
	let mockOtherTeacherUser: User;
	let mockStudentUser: User;
	let mockDifferentSchoolAdminUser: User;
	let mockUnknownRoleUser: User;
	let mockExternalUser: User;
	let mockUserWithoutAccount: User;
	let mockUserWithoutRole: User;

	let mockSuperheroAccount: Account;
	let mockTeacherAccount: Account;
	let mockDemoTeacherAccount: Account;
	let mockDemoStudentAccount: Account;
	let mockOtherTeacherAccount: Account;
	let mockAdminAccount: Account;
	let mockStudentAccount: Account;
	let mockDifferentSchoolAdminAccount: Account;
	let mockUnknownRoleUserAccount: Account;
	let mockExternalUserAccount: Account;
	let mockAccountWithoutRole: Account;

	const defaultPassword = 'DummyPasswd!1';
	const defaultPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';

	const mockUserIdMap = new Map<string, User>();
	const mockAccountIdMap = new Map<string, Account>();
	const mockAccountUserIdMap = new Map<string, Account>();
	const mockAccountUsernameMap = new Map<string, Account>();
	const mockUserMailMap = new Map<string, User>();

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
							return Promise.resolve(accountFactory.buildWithId());
						},
						read: (): Promise<Account> => {
							return Promise.resolve(mockAdminAccount);
						},
						update: jest.fn().mockImplementation((account: Account): Promise<Account> => {
							if (account.username === 'fail@to.update') {
								return Promise.reject();
							}
							return Promise.resolve(account);
						}),
						delete: (accountId: EntityId): Promise<Account> => {
							switch (accountId) {
								case mockAdminAccount.id:
									return Promise.resolve(mockAdminAccount);
								case mockStudentAccount.id:
									return Promise.resolve(mockStudentAccount);
								default:
									throw new EntityNotFoundError(Account.name);
							}
						},
						findByUserId: (userId: EntityId): Promise<Account> => {
							const account = mockAccountUserIdMap.get(userId);

							if (account) {
								return Promise.resolve(account);
							}
							if (userId === 'accountWithoutUser') {
								return Promise.resolve(mockStudentAccount);
							}
							throw Error();
						},
						findByUsername: (username: string): Promise<Account[]> => {
							const account = mockAccountUsernameMap.get(username);

							if (account) {
								return Promise.resolve([account]);
							}
							if (username === 'not@available.username') {
								return Promise.resolve([mockExternalUserAccount]);
							}
							if (username === 'multiple@account.username') {
								return Promise.resolve(Array.from(mockAccountUsernameMap.values()));
							}
							return Promise.resolve([]);
						},
						findById: (accountId: EntityId): Promise<Account> => {
							const account = mockAccountIdMap.get(accountId);

							if (account) {
								return Promise.resolve(account);
							}
							throw new EntityNotFoundError(Account.name);
						},
						searchByUsername: (): Promise<Account[]> => {
							const accounts = mockAccountIdMap.values();
							return Promise.resolve(Array.from(accounts));
						},
					},
				},
				{
					provide: UserRepo,
					useValue: {
						findById: (userId: EntityId): Promise<User> => {
							const user = mockUserIdMap.get(userId);
							if (user) {
								return Promise.resolve(user);
							}
							throw Error();
						},
						findByEmail: (email: string): Promise<User[]> => {
							const user = mockUserMailMap.get(email);

							if (user) {
								return Promise.resolve([user]);
							}
							if (email === 'not@available.email') {
								return Promise.resolve([mockExternalUser]);
							}
							if (email === 'multiple@user.email') {
								return Promise.resolve(Array.from(mockUserMailMap.values()));
							}
							return Promise.resolve([]);
						},
						update: jest.fn().mockImplementation((user: User): Promise<User> => {
							if (user.firstName === 'failToUpdate') {
								return Promise.reject();
							}
							return Promise.resolve(user);
						}),
					},
				},
				PermissionService,
			],
		}).compile();

		accountUc = module.get(AccountUc);
		userRepo = module.get(UserRepo);
		accountRepo = module.get(AccountRepo);
		orm = await setupEntities();
	});

	beforeEach(() => {
		mockSchool = schoolFactory.buildWithId();
		mockOtherSchool = schoolFactory.buildWithId();

		mockSuperheroUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [new Role({ name: 'superhero', permissions: ['TEACHER_EDIT', 'STUDENT_EDIT'] })],
		});
		mockAdminUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [new Role({ name: 'administrator', permissions: ['TEACHER_EDIT', 'STUDENT_EDIT'] })],
		});
		mockTeacherUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [new Role({ name: 'teacher', permissions: ['STUDENT_EDIT'] })],
		});
		mockDemoTeacherUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [new Role({ name: 'demoTeacher', permissions: ['STUDENT_EDIT'] })],
		});
		mockOtherTeacherUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [new Role({ name: 'teacher', permissions: ['STUDENT_EDIT'] })],
		});
		mockStudentUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [new Role({ name: 'student', permissions: [] })],
		});
		mockDemoStudentUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [new Role({ name: 'demoStudent', permissions: [] })],
		});
		mockDifferentSchoolAdminUser = userFactory.buildWithId({
			school: mockOtherSchool,
			roles: [new Role({ name: 'administrator', permissions: ['TEACHER_EDIT', 'STUDENT_EDIT'] })],
		});
		mockUserWithoutAccount = userFactory.buildWithId({
			school: mockSchool,
			roles: [new Role({ name: 'administrator', permissions: ['TEACHER_EDIT', 'STUDENT_EDIT'] })],
		});
		mockUserWithoutRole = userFactory.buildWithId({
			school: mockSchool,
			roles: [],
		});
		mockUnknownRoleUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [new Role({ name: 'undefinedRole', permissions: [''] })],
		});
		mockExternalUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [new Role({ name: 'student', permissions: [] })],
		});

		mockSuperheroAccount = accountFactory.buildWithId({
			user: mockSuperheroUser,
			password: defaultPasswordHash,
			system: undefined,
		});
		mockTeacherAccount = accountFactory.buildWithId({
			user: mockTeacherUser,
			password: defaultPasswordHash,
			system: undefined,
		});
		mockDemoTeacherAccount = accountFactory.buildWithId({
			user: mockDemoTeacherUser,
			password: defaultPasswordHash,
			system: undefined,
		});
		mockOtherTeacherAccount = accountFactory.buildWithId({
			user: mockOtherTeacherUser,
			password: defaultPasswordHash,
			system: undefined,
		});
		mockAdminAccount = accountFactory.buildWithId({
			user: mockAdminUser,
			password: defaultPasswordHash,
			system: undefined,
		});
		mockStudentAccount = accountFactory.buildWithId({
			user: mockStudentUser,
			password: defaultPasswordHash,
			system: undefined,
		});
		mockDemoStudentAccount = accountFactory.buildWithId({
			user: mockDemoStudentUser,
			password: defaultPasswordHash,
			system: undefined,
		});
		mockAccountWithoutRole = accountFactory.buildWithId({
			user: mockUserWithoutRole,
			password: defaultPasswordHash,
			system: undefined,
		});
		mockDifferentSchoolAdminAccount = accountFactory.buildWithId({
			user: mockDifferentSchoolAdminUser,
			password: defaultPasswordHash,
			system: undefined,
		});
		mockUnknownRoleUserAccount = accountFactory.buildWithId({
			user: mockUnknownRoleUser,
			password: defaultPasswordHash,
			system: undefined,
		});
		mockExternalUserAccount = accountFactory.buildWithId({ user: mockExternalUser, password: defaultPasswordHash });

		const mockUsers = [
			mockSuperheroUser,
			mockAdminUser,
			mockTeacherUser,
			mockDemoTeacherUser,
			mockOtherTeacherUser,
			mockStudentUser,
			mockDemoStudentUser,
			mockDifferentSchoolAdminUser,
			mockUnknownRoleUser,
			mockExternalUser,
			mockUserWithoutRole,
			mockUserWithoutAccount,
		];

		const mockAccounts = [
			mockSuperheroAccount,
			mockAdminAccount,
			mockTeacherAccount,
			mockDemoTeacherAccount,
			mockOtherTeacherAccount,
			mockStudentAccount,
			mockDemoStudentAccount,
			mockDifferentSchoolAdminAccount,
			mockUnknownRoleUserAccount,
			mockExternalUserAccount,
			mockAccountWithoutRole,
		];

		for (let i = 0; i < mockUsers.length; i += 1) {
			mockUserIdMap.set(mockUsers[i].id, mockUsers[i]);
			mockUserMailMap.set(mockUsers[i].email, mockUsers[i]);
		}
		for (let i = 0; i < mockAccounts.length; i += 1) {
			mockAccountUserIdMap.set(mockAccounts[i].user.id, mockAccounts[i]);
			mockAccountUsernameMap.set(mockAccounts[i].username, mockAccounts[i]);
			mockAccountIdMap.set(mockAccounts[i].id, mockAccounts[i]);
		}
	});

	describe('changePasswordForUser', () => {
		it("should throw if target user's account does not exist", async () => {
			await expect(
				accountUc.changePasswordForUser(mockAdminUser.id, mockUserWithoutAccount.id, 'DummyPasswd!2')
			).rejects.toThrow(EntityNotFoundError);
		});
		it('should throw if target users does not exist', async () => {
			await expect(
				accountUc.changePasswordForUser(mockAdminUser.id, 'accountWithoutUser', defaultPassword)
			).rejects.toThrow(EntityNotFoundError);
		});
		it('should throw if current user does not exist', async () => {
			await expect(accountUc.changePasswordForUser('currentUser', mockTeacherUser.id, 'DummyPasswd!2')).rejects.toThrow(
				EntityNotFoundError
			);
		});
		it("should allow an admin to update a user's password", async () => {
			const previousPasswordHash = mockTeacherAccount.password;
			expect(mockTeacherAccount.user.forcePasswordChange).toBeUndefined();
			await accountUc.changePasswordForUser(mockAdminUser.id, mockTeacherUser.id, defaultPassword);
			expect(mockTeacherAccount.password).not.toBe(previousPasswordHash);
		});
		it('should force renewal of an administrative password reset', async () => {
			expect(mockTeacherAccount.user.forcePasswordChange).toBeUndefined();
			await accountUc.changePasswordForUser(mockAdminUser.id, mockTeacherUser.id, defaultPassword);
			expect(mockTeacherUser.forcePasswordChange).toBe(true);
		});
		it('should reject if update in user repo fails', async () => {
			(accountRepo.update as jest.Mock).mockRejectedValueOnce(new Error('account not found'));
			await expect(
				accountUc.changePasswordForUser(mockAdminUser.id, mockStudentUser.id, 'DummyPasswd!1')
			).rejects.toThrow(EntityNotFoundError);
		});
		it('should reject if update in account repo fails', async () => {
			(userRepo.update as jest.Mock).mockRejectedValueOnce(new Error('user not found'));
			await expect(
				accountUc.changePasswordForUser(mockAdminUser.id, mockStudentUser.id, 'DummyPasswd!1')
			).rejects.toThrow(EntityNotFoundError);
		});

		describe('hasPermissionsToChangePassword', () => {
			it('admin can edit teacher', async () => {
				const previousPasswordHash = mockTeacherAccount.password;
				await accountUc.changePasswordForUser(mockAdminUser.id, mockTeacherUser.id, defaultPassword);
				expect(mockTeacherAccount.password).not.toBe(previousPasswordHash);
			});
			it('teacher can edit student', async () => {
				const previousPasswordHash = mockStudentAccount.password;
				await accountUc.changePasswordForUser(mockTeacherUser.id, mockStudentUser.id, defaultPassword);
				expect(mockStudentAccount.password).not.toBe(previousPasswordHash);
			});
			it('demo teacher cannot edit student', async () => {
				await expect(
					accountUc.changePasswordForUser(mockDemoTeacherUser.id, mockStudentUser.id, defaultPassword)
				).rejects.toThrow(ForbiddenException);
			});
			it('admin can edit student', async () => {
				const previousPasswordHash = mockStudentAccount.password;
				await accountUc.changePasswordForUser(mockAdminUser.id, mockStudentUser.id, defaultPassword);
				expect(mockStudentAccount.password).not.toBe(previousPasswordHash);
			});
			it('teacher cannot edit other teacher', async () => {
				await expect(
					accountUc.changePasswordForUser(mockTeacherUser.id, mockOtherTeacherUser.id, defaultPassword)
				).rejects.toThrow(ForbiddenException);
			});
			it("other school's admin cannot edit teacher", async () => {
				await expect(
					accountUc.changePasswordForUser(mockDifferentSchoolAdminUser.id, mockTeacherUser.id, defaultPassword)
				).rejects.toThrow(ForbiddenException);
			});
			it('superhero can edit admin', async () => {
				const previousPasswordHash = mockAdminAccount.password;
				await accountUc.changePasswordForUser(mockSuperheroUser.id, mockAdminUser.id, defaultPassword);
				expect(mockAdminAccount.password).not.toBe(previousPasswordHash);
			});
			it('undefined user role fails by default', async () => {
				await expect(
					accountUc.changePasswordForUser(mockUnknownRoleUser.id, mockUnknownRoleUser.id, defaultPassword)
				).rejects.toThrow(ForbiddenException);
			});
			it('user without role cannot be edited', async () => {
				await expect(
					accountUc.changePasswordForUser(mockAdminUser.id, mockUserWithoutRole.id, 'DummyPasswd!1')
				).rejects.toThrow(ForbiddenException);
			});
		});
	});

	describe('updateMyAccount', () => {
		it('should throw if user does not exist', async () => {
			mockStudentAccount.user.forcePasswordChange = true;
			mockStudentAccount.user.preferences = { firstLogin: true };
			await expect(accountUc.updateMyAccount('accountWithoutUser', { passwordOld: defaultPassword })).rejects.toThrow(
				EntityNotFoundError
			);
		});
		it('should throw if account does not exist', async () => {
			await expect(
				accountUc.updateMyAccount(mockUserWithoutAccount.id, {
					passwordOld: defaultPassword,
				})
			).rejects.toThrow(EntityNotFoundError);
		});
		it('should throw if account is external', async () => {
			await expect(
				accountUc.updateMyAccount(mockExternalUserAccount.user.id, {
					passwordOld: defaultPassword,
				})
			).rejects.toThrow(ForbiddenOperationError);
		});
		it('should throw if password does not match', async () => {
			await expect(
				accountUc.updateMyAccount(mockStudentUser.id, {
					passwordOld: 'DoesNotMatch',
				})
			).rejects.toThrow(AuthorizationError);
		});
		it('should throw if changing own name is not allowed', async () => {
			await expect(
				accountUc.updateMyAccount(mockStudentUser.id, {
					passwordOld: defaultPassword,
					firstName: 'newFirstName',
				})
			).rejects.toThrow(ForbiddenOperationError);
			await expect(
				accountUc.updateMyAccount(mockStudentUser.id, {
					passwordOld: defaultPassword,
					lastName: 'newLastName',
				})
			).rejects.toThrow(ForbiddenOperationError);
		});
		it('should allow to update email', async () => {
			await expect(
				accountUc.updateMyAccount(mockStudentUser.id, {
					passwordOld: defaultPassword,
					email: 'an@available.mail',
				})
			).resolves.not.toThrow();
		});
		it('should use email as account user name in lower case', async () => {
			const accountRepoSpy = jest.spyOn(accountRepo, 'update');
			const testMail = 'AN@AVAILABLE.MAIL';
			await expect(
				accountUc.updateMyAccount(mockStudentUser.id, {
					passwordOld: defaultPassword,
					email: testMail,
				})
			).resolves.not.toThrow();
			expect(accountRepoSpy).toBeCalledWith(expect.objectContaining({ username: testMail.toLowerCase() }));
		});
		it('should use email as user email in lower case', async () => {
			const userUpdateSpy = jest.spyOn(userRepo, 'update');
			const testMail = 'AN@AVAILABLE.MAIL';
			await expect(
				accountUc.updateMyAccount(mockStudentUser.id, {
					passwordOld: defaultPassword,
					email: testMail,
				})
			).resolves.not.toThrow();
			expect(userUpdateSpy).toBeCalledWith(expect.objectContaining({ email: testMail.toLowerCase() }));
		});
		it('should always update account user name AND user email together.', async () => {
			const accountUpdateSpy = jest.spyOn(accountRepo, 'update');
			const userUpdateSpy = jest.spyOn(userRepo, 'update');
			const testMail = 'an@available.mail';
			await expect(
				accountUc.updateMyAccount(mockStudentUser.id, {
					passwordOld: defaultPassword,
					email: testMail,
				})
			).resolves.not.toThrow();
			expect(userUpdateSpy).toBeCalledWith(expect.objectContaining({ email: testMail.toLowerCase() }));
			expect(accountUpdateSpy).toBeCalledWith(expect.objectContaining({ username: testMail.toLowerCase() }));
		});
		it('should throw if new email already in use', async () => {
			await expect(
				accountUc.updateMyAccount(mockStudentUser.id, {
					passwordOld: defaultPassword,
					email: mockAdminUser.email,
				})
			).rejects.toThrow(ValidationError);
			// other criteria branching
			await expect(
				accountUc.updateMyAccount(mockStudentUser.id, {
					passwordOld: defaultPassword,
					email: 'multiple@user.email',
				})
			).rejects.toThrow(ValidationError);
			await expect(
				accountUc.updateMyAccount(mockStudentUser.id, {
					passwordOld: defaultPassword,
					email: 'multiple@account.username',
				})
			).rejects.toThrow(ValidationError);
			await expect(
				accountUc.updateMyAccount(mockStudentUser.id, {
					passwordOld: defaultPassword,
					email: 'not@available.email',
				})
			).rejects.toThrow(ValidationError);
			await expect(
				accountUc.updateMyAccount(mockStudentUser.id, {
					passwordOld: defaultPassword,
					email: 'not@available.username',
				})
			).rejects.toThrow(ValidationError);
		});
		it('should throw if new email already in use ignore case', async () => {
			await expect(
				accountUc.updateMyAccount(mockStudentUser.id, {
					passwordOld: defaultPassword,
					email: mockAdminUser.email.toUpperCase(),
				})
			).rejects.toThrow(ValidationError);
		});
		it('should allow to update with strong password', async () => {
			await expect(
				accountUc.updateMyAccount(mockStudentUser.id, {
					passwordOld: defaultPassword,
					passwordNew: 'DummyPasswd!2',
				})
			).resolves.not.toThrow();
		});
		it('should allow to update first and last name if teacher', async () => {
			await expect(
				accountUc.updateMyAccount(mockTeacherUser.id, {
					passwordOld: defaultPassword,
					firstName: 'newFirstName',
				})
			).resolves.not.toThrow();
			await expect(
				accountUc.updateMyAccount(mockTeacherUser.id, {
					passwordOld: defaultPassword,
					lastName: 'newLastName',
				})
			).resolves.not.toThrow();
		});
		it('should allow to update first and last name if admin', async () => {
			await expect(
				accountUc.updateMyAccount(mockAdminUser.id, {
					passwordOld: defaultPassword,
					firstName: 'newFirstName',
				})
			).resolves.not.toThrow();
			await expect(
				accountUc.updateMyAccount(mockAdminUser.id, {
					passwordOld: defaultPassword,
					lastName: 'newLastName',
				})
			).resolves.not.toThrow();
		});
		it('should allow to update first and last name if superhero', async () => {
			await expect(
				accountUc.updateMyAccount(mockSuperheroUser.id, {
					passwordOld: defaultPassword,
					firstName: 'newFirstName',
				})
			).resolves.not.toThrow();
			await expect(
				accountUc.updateMyAccount(mockSuperheroUser.id, {
					passwordOld: defaultPassword,
					lastName: 'newLastName',
				})
			).resolves.not.toThrow();
		});
		it('should throw if user is a demo student', async () => {
			await expect(
				accountUc.updateMyAccount(mockDemoStudentAccount.user.id, {
					passwordOld: defaultPassword,
					passwordNew: 'DummyPasswd!2',
				})
			).rejects.toThrow(ForbiddenOperationError);
		});
		it('should throw if user is a demo teacher', async () => {
			await expect(
				accountUc.updateMyAccount(mockDemoTeacherAccount.user.id, {
					passwordOld: defaultPassword,
					passwordNew: 'DummyPasswd!2',
				})
			).rejects.toThrow(ForbiddenOperationError);
		});
		it('should throw if user can not be updated', async () => {
			await expect(
				accountUc.updateMyAccount(mockTeacherUser.id, {
					passwordOld: defaultPassword,
					firstName: 'failToUpdate',
				})
			).rejects.toThrow(EntityNotFoundError);
		});
		it('should throw if account can not be updated', async () => {
			await expect(
				accountUc.updateMyAccount(mockStudentUser.id, {
					passwordOld: defaultPassword,
					email: 'fail@to.update',
				})
			).rejects.toThrow(EntityNotFoundError);
		});
	});

	describe('replaceMyTemporaryPassword', () => {
		it('should throw if passwords do not match', async () => {
			await expect(
				accountUc.replaceMyTemporaryPassword(mockStudentAccount.user.id, defaultPassword, 'FooPasswd!1')
			).rejects.toThrow(ForbiddenOperationError);
		});

		it('should throw if account does not exist', async () => {
			await expect(
				accountUc.replaceMyTemporaryPassword(mockUserWithoutAccount.id, defaultPassword, defaultPassword)
			).rejects.toThrow(EntityNotFoundError);
		});
		it('should throw if user does not exist', async () => {
			await expect(
				accountUc.replaceMyTemporaryPassword('accountWithoutUser', defaultPassword, defaultPassword)
			).rejects.toThrow(EntityNotFoundError);
		});
		it('should throw if account is external', async () => {
			await expect(
				accountUc.replaceMyTemporaryPassword(mockExternalUserAccount.user.id, defaultPassword, defaultPassword)
			).rejects.toThrow(ForbiddenOperationError);
		});
		it('should throw if not the users password is temporary', async () => {
			mockStudentAccount.user.forcePasswordChange = false;
			mockStudentAccount.user.preferences = { firstLogin: true };
			await expect(
				accountUc.replaceMyTemporaryPassword(mockStudentAccount.user.id, defaultPassword, defaultPassword)
			).rejects.toThrow(ForbiddenOperationError);
		});
		it('should throw, if old password is the same as new password', async () => {
			mockStudentAccount.user.forcePasswordChange = false;
			mockStudentAccount.user.preferences = { firstLogin: false };
			await expect(
				accountUc.replaceMyTemporaryPassword(mockStudentAccount.user.id, defaultPassword, defaultPassword)
			).rejects.toThrow(ForbiddenOperationError);
		});
		it('should throw, if old password is undefined', async () => {
			mockStudentAccount.user.forcePasswordChange = false;
			mockStudentAccount.user.preferences = { firstLogin: false };
			mockStudentAccount.password = undefined;
			await expect(
				accountUc.replaceMyTemporaryPassword(mockStudentAccount.user.id, defaultPassword, defaultPassword)
			).rejects.toThrow(Error);
		});
		it('should allow to set strong password, if the admin manipulated the users password', async () => {
			mockStudentAccount.user.forcePasswordChange = true;
			mockStudentAccount.user.preferences = { firstLogin: true };
			await expect(
				accountUc.replaceMyTemporaryPassword(mockStudentAccount.user.id, 'DummyPasswd!2', 'DummyPasswd!2')
			).resolves.not.toThrow();
		});
		it('should allow to set strong password, if this is the users first login', async () => {
			mockStudentAccount.user.forcePasswordChange = false;
			mockStudentAccount.user.preferences = { firstLogin: false };
			await expect(
				accountUc.replaceMyTemporaryPassword(mockStudentAccount.user.id, 'DummyPasswd!2', 'DummyPasswd!2')
			).resolves.not.toThrow();
		});
		it('should throw if user is a demo student', async () => {
			mockDemoStudentAccount.user.forcePasswordChange = false;
			mockDemoStudentAccount.user.preferences = { firstLogin: false };
			await expect(
				accountUc.replaceMyTemporaryPassword(mockDemoStudentAccount.user.id, 'DummyPasswd!2', 'DummyPasswd!2')
			).rejects.toThrow(ForbiddenOperationError);
		});
		it('should throw if user is a demo teacher', async () => {
			mockDemoTeacherAccount.user.forcePasswordChange = false;
			mockDemoTeacherAccount.user.preferences = { firstLogin: false };
			await expect(
				accountUc.replaceMyTemporaryPassword(mockDemoTeacherAccount.user.id, 'DummyPasswd!2', 'DummyPasswd!2')
			).rejects.toThrow(ForbiddenOperationError);
		});
		it('should throw if user can not be updated', async () => {
			mockStudentAccount.user.forcePasswordChange = false;
			mockStudentAccount.user.preferences = { firstLogin: false };
			mockStudentAccount.user.firstName = 'failToUpdate';
			await expect(
				accountUc.replaceMyTemporaryPassword(mockStudentAccount.user.id, 'DummyPasswd!2', 'DummyPasswd!2')
			).rejects.toThrow(EntityNotFoundError);
		});
		it('should throw if account can not be updated', async () => {
			mockStudentAccount.user.forcePasswordChange = false;
			mockStudentAccount.user.preferences = { firstLogin: false };
			mockStudentAccount.username = 'fail@to.update';
			await expect(
				accountUc.replaceMyTemporaryPassword(mockStudentAccount.user.id, 'DummyPasswd!2', 'DummyPasswd!2')
			).rejects.toThrow(EntityNotFoundError);
		});
	});
});
