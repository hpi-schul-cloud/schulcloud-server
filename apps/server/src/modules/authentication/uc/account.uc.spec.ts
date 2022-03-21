import { MikroORM } from '@mikro-orm/core';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { Account, EntityId, ICurrentUser, PermissionService, Role, School, User } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { AccountRepo } from '@shared/repo/account';
import { accountFactory, schoolFactory, setupEntities, userFactory } from '@shared/testing';
import { AccountUc } from './account.uc';

describe('AccountUc', () => {
	let module: TestingModule;
	let accountUc: AccountUc;
	let orm: MikroORM;

	let mockSchool: School;
	let mockOtherSchool: School;

	let mockSuperheroUser: User;
	let mockAdminUser: User;
	let mockTeacherUser: User;
	let mockDemoTeacherUser: User;
	let mockOtherTeacherUser: User;
	let mockStudentUser: User;
	let mockDifferentSchoolAdminUser: User;

	let mockSuperheroAccount: Account;
	let mockTeacherAccount: Account;
	let mockDemoTeacherAccount: Account;
	let mockOtherTeacherAccount: Account;
	let mockAdminAccount: Account;
	let mockStudentAccount: Account;
	let mockDifferentSchoolAdminAccount: Account;

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
							return Promise.resolve(mockAdminAccount);
						},
						read: (): Promise<Account> => {
							return Promise.resolve(mockAdminAccount);
						},
						update: (account: Account): Promise<Account> => {
							return Promise.resolve(account);
						},
						delete: (): Promise<Account> => {
							return Promise.resolve(mockAdminAccount);
						},
						findByUserId: (userId: EntityId): Promise<Account> => {
							if (userId === mockSuperheroAccount.user.id) {
								return Promise.resolve(mockSuperheroAccount);
							}
							if (userId === mockAdminAccount.user.id) {
								return Promise.resolve(mockAdminAccount);
							}
							if (userId === mockDifferentSchoolAdminAccount.user.id) {
								return Promise.resolve(mockAdminAccount);
							}
							if (userId === mockTeacherAccount.user.id) {
								return Promise.resolve(mockTeacherAccount);
							}
							if (userId === mockDemoTeacherAccount.user.id) {
								return Promise.resolve(mockDemoTeacherAccount);
							}
							if (userId === mockStudentAccount.user.id) {
								return Promise.resolve(mockStudentAccount);
							}
							if (userId === mockOtherTeacherAccount.user.id) {
								return Promise.resolve(mockOtherTeacherAccount);
							}
							if (userId === 'accountWithoutUser') {
								return Promise.resolve(mockStudentAccount);
							}
							throw Error();
						},
					},
				},
				{
					provide: UserRepo,
					useValue: {
						findById: (userId: EntityId): Promise<User> => {
							if (userId === mockSuperheroAccount.user.id) {
								return Promise.resolve(mockSuperheroAccount.user);
							}
							if (userId === mockAdminAccount.user.id) {
								return Promise.resolve(mockAdminAccount.user);
							}
							if (userId === mockDifferentSchoolAdminAccount.user.id) {
								return Promise.resolve(mockDifferentSchoolAdminAccount.user);
							}
							if (userId === mockTeacherAccount.user.id) {
								return Promise.resolve(mockTeacherAccount.user);
							}
							if (userId === mockDemoTeacherAccount.user.id) {
								return Promise.resolve(mockDemoTeacherAccount.user);
							}
							if (userId === mockStudentAccount.user.id) {
								return Promise.resolve(mockStudentAccount.user);
							}
							if (userId === mockOtherTeacherAccount.user.id) {
								return Promise.resolve(mockOtherTeacherAccount.user);
							}
							if (userId === 'userWithoutAccount') {
								return Promise.resolve(mockStudentAccount.user);
							}
							throw Error();
						},
						update: (user: User): Promise<User> => {
							return Promise.resolve(user);
						},
					},
				},
				PermissionService,
			],
		}).compile();

		accountUc = module.get(AccountUc);
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
		mockDifferentSchoolAdminUser = userFactory.buildWithId({
			school: mockOtherSchool,
			roles: [new Role({ name: 'administrator', permissions: ['TEACHER_EDIT', 'STUDENT_EDIT'] })],
		});

		// DummyPasswd!1
		const defaultPassword = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';
		mockSuperheroAccount = accountFactory.buildWithId({ user: mockSuperheroUser, password: defaultPassword });
		mockTeacherAccount = accountFactory.buildWithId({ user: mockTeacherUser, password: defaultPassword });
		mockDemoTeacherAccount = accountFactory.buildWithId({ user: mockDemoTeacherUser, password: defaultPassword });
		mockOtherTeacherAccount = accountFactory.buildWithId({ user: mockOtherTeacherUser, password: defaultPassword });
		mockAdminAccount = accountFactory.buildWithId({ user: mockAdminUser, password: defaultPassword });
		mockStudentAccount = accountFactory.buildWithId({ user: mockStudentUser, password: defaultPassword });
		mockDifferentSchoolAdminAccount = accountFactory.buildWithId({
			user: mockDifferentSchoolAdminUser,
			password: defaultPassword,
		});
	});

	describe('changePasswordForUser', () => {
		it('should throw if account does not exist', async () => {
			await expect(accountUc.changePasswordForUser('currentUser', 'targetUser', 'DummyPasswd!1')).rejects.toThrow(
				EntityNotFoundError
			);
		});

		it('should throw if user does not exist', async () => {
			await expect(accountUc.changePasswordForUser('currentUser', 'targetUser', 'DummyPasswd!1')).rejects.toThrow(
				EntityNotFoundError
			);
		});

		it('should throw if password is weak', async () => {
			await expect(
				accountUc.changePasswordForUser(mockAdminAccount.user.id, mockTeacherAccount.user.id, 'weak')
			).rejects.toThrow();
		});

		it('should accept strong password, update it and force renewal', async () => {
			const previousPasswordHash = mockTeacherAccount.password;
			expect(mockTeacherAccount.user.forcePasswordChange).toBeFalsy();
			await accountUc.changePasswordForUser(mockAdminUser.id, mockTeacherUser.id, 'DummyPasswd!1');
			expect(mockTeacherAccount.password).not.toBe(previousPasswordHash);
			expect(mockTeacherUser.forcePasswordChange).toBe(true);
		});

		describe('hasPermissionsToChangePassword', () => {
			it('admin can edit teacher', async () => {
				const previousPasswordHash = mockTeacherAccount.password;
				await accountUc.changePasswordForUser(mockAdminUser.id, mockTeacherUser.id, 'DummyPasswd!1');
				expect(mockTeacherAccount.password).not.toBe(previousPasswordHash);
			});
			it('teacher can edit student', async () => {
				const previousPasswordHash = mockStudentAccount.password;
				await accountUc.changePasswordForUser(mockTeacherUser.id, mockStudentUser.id, 'DummyPasswd!1');
				expect(mockStudentAccount.password).not.toBe(previousPasswordHash);
			});
			it('demo teacher cannot edit student', async () => {
				await expect(
					accountUc.changePasswordForUser(mockDemoTeacherUser.id, mockStudentUser.id, 'DummyPasswd!1')
				).rejects.toThrow(ForbiddenException);
			});
			it('admin can edit student', async () => {
				const previousPasswordHash = mockStudentAccount.password;
				await accountUc.changePasswordForUser(mockAdminUser.id, mockStudentUser.id, 'DummyPasswd!1');
				expect(mockStudentAccount.password).not.toBe(previousPasswordHash);
			});
			it('teacher cannot edit other teacher', async () => {
				await expect(
					accountUc.changePasswordForUser(mockTeacherUser.id, mockOtherTeacherUser.id, 'DummyPasswd!1')
				).rejects.toThrow(ForbiddenException);
			});
			it("other school's admin cannot edit teacher", async () => {
				await expect(
					accountUc.changePasswordForUser(mockDifferentSchoolAdminUser.id, mockTeacherUser.id, 'DummyPasswd!1')
				).rejects.toThrow(ForbiddenException);
			});
			it('superhero can edit admin', async () => {
				const previousPasswordHash = mockAdminAccount.password;
				await accountUc.changePasswordForUser(mockSuperheroUser.id, mockAdminUser.id, 'DummyPasswd!1');
				expect(mockAdminAccount.password).not.toBe(previousPasswordHash);
			});
		});
	});

	describe('updateMyAccount', () => {
		it('should throw if user does not exist', async () => {
			await expect(
				accountUc.updateMyAccount({ userId: 'userId' } as ICurrentUser, { passwordOld: 'DummyPasswd!1' })
			).rejects.toThrow(EntityNotFoundError);
		});
		it('should throw if account does not exist', async () => {
			mockStudentAccount.user.forcePasswordChange = true;
			mockStudentAccount.user.preferences = { firstLogin: true };
			await expect(
				accountUc.updateMyAccount({ userId: 'userWithoutAccount' } as ICurrentUser, { passwordOld: 'DummyPasswd!1' })
			).rejects.toThrow(EntityNotFoundError);
		});
		it('should throw if password does not match', async () => {
			await expect(
				accountUc.updateMyAccount({ userId: mockStudentUser.id } as ICurrentUser, { passwordOld: 'DoesNotMatch' })
			).rejects.toThrow();
		});
		it('should throw if new password is weak', async () => {
			await expect(
				accountUc.updateMyAccount({ userId: mockStudentUser.id } as ICurrentUser, {
					passwordOld: 'DummyPasswd!1',
					passwordNew: 'weak',
				})
			).rejects.toThrow();
		});
		it('should throw if new email is invalid', async () => {
			await expect(
				accountUc.updateMyAccount({ userId: mockStudentUser.id } as ICurrentUser, {
					passwordOld: 'DummyPasswd!1',
					email: 'NoValidMail',
				})
			).rejects.toThrow();
		});
		it('should throw if changing own name is not allowed', async () => {
			await expect(
				accountUc.updateMyAccount({ userId: mockStudentUser.id } as ICurrentUser, {
					passwordOld: 'DummyPasswd!1',
					firstName: 'newFirstName',
				})
			).rejects.toThrow(ForbiddenException);
			await expect(
				accountUc.updateMyAccount({ userId: mockStudentUser.id } as ICurrentUser, {
					passwordOld: 'DummyPasswd!1',
					lastName: 'newFirstName',
				})
			).rejects.toThrow(ForbiddenException);
		});
		it('should allow to update email', async () => {
			await expect(
				accountUc.updateMyAccount({ userId: mockStudentUser.id } as ICurrentUser, {
					passwordOld: 'DummyPasswd!1',
					email: 'an@available.mail',
				})
			).resolves.not.toThrow();
		});
		it('should allow to update with strong password', async () => {
			await expect(
				accountUc.updateMyAccount({ userId: mockStudentUser.id } as ICurrentUser, {
					passwordOld: 'DummyPasswd!1',
					passwordNew: 'DummyPasswd!2',
				})
			).resolves.not.toThrow();
		});
		it('should allow to update language', async () => {
			await expect(
				accountUc.updateMyAccount({ userId: mockStudentUser.id } as ICurrentUser, {
					passwordOld: 'DummyPasswd!1',
					language: 'newLanguage',
				})
			).resolves.not.toThrow();
		});
		it('should allow to update first and last name if teacher', async () => {
			await expect(
				accountUc.updateMyAccount({ userId: mockTeacherUser.id } as ICurrentUser, {
					passwordOld: 'DummyPasswd!1',
					firstName: 'newFirstName',
				})
			).resolves.not.toThrow();
			await expect(
				accountUc.updateMyAccount({ userId: mockTeacherUser.id } as ICurrentUser, {
					passwordOld: 'DummyPasswd!1',
					firstName: 'newLastName',
				})
			).resolves.not.toThrow();
		});
		it('should allow to update first and last name if admin', async () => {
			await expect(
				accountUc.updateMyAccount({ userId: mockAdminUser.id } as ICurrentUser, {
					passwordOld: 'DummyPasswd!1',
					firstName: 'newFirstName',
				})
			).resolves.not.toThrow();
			await expect(
				accountUc.updateMyAccount({ userId: mockAdminUser.id } as ICurrentUser, {
					passwordOld: 'DummyPasswd!1',
					firstName: 'newLastName',
				})
			).resolves.not.toThrow();
		});
		it('should allow to update first and last name if superhero', async () => {
			await expect(
				accountUc.updateMyAccount({ userId: mockSuperheroUser.id } as ICurrentUser, {
					passwordOld: 'DummyPasswd!1',
					firstName: 'newFirstName',
				})
			).resolves.not.toThrow();
			await expect(
				accountUc.updateMyAccount({ userId: mockSuperheroUser.id } as ICurrentUser, {
					passwordOld: 'DummyPasswd!1',
					firstName: 'newLastName',
				})
			).resolves.not.toThrow();
		});
	});

	describe('changeMyTemporaryPassword', () => {
		it('should throw if account does not exist', async () => {
			await expect(accountUc.changeMyTemporaryPassword('NA', 'DummyPasswd!1')).rejects.toThrow(EntityNotFoundError);
		});
		it('should throw if user does not exist', async () => {
			await expect(accountUc.changeMyTemporaryPassword('accountWithoutUser', 'DummyPasswd!1')).rejects.toThrow(
				EntityNotFoundError
			);
		});
		it('should throw if password is weak', async () => {
			mockStudentAccount.user.forcePasswordChange = true;
			mockStudentAccount.user.preferences = { firstLogin: true };
			await expect(accountUc.changeMyTemporaryPassword(mockStudentAccount.user.id, 'weak')).rejects.toThrow();
		});
		it('should throw if not the users password is temporary', async () => {
			mockStudentAccount.user.forcePasswordChange = false;
			mockStudentAccount.user.preferences = { firstLogin: true };
			await expect(accountUc.changeMyTemporaryPassword(mockStudentAccount.user.id, 'DummyPasswd!1')).rejects.toThrow(
				ForbiddenException
			);
		});
		it('should allow to set strong password, if the admin manipulated the users password', async () => {
			mockStudentAccount.user.forcePasswordChange = true;
			mockStudentAccount.user.preferences = { firstLogin: true };
			await expect(
				accountUc.changeMyTemporaryPassword(mockStudentAccount.user.id, 'DummyPasswd!1')
			).resolves.not.toThrow();
		});
		it('should allow to set strong password, if this is the users first login', async () => {
			mockStudentAccount.user.forcePasswordChange = false;
			mockStudentAccount.user.preferences = { firstLogin: false };
			await expect(
				accountUc.changeMyTemporaryPassword(mockStudentAccount.user.id, 'DummyPasswd!1')
			).resolves.not.toThrow();
		});
	});
});
