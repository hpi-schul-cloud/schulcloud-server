import { MikroORM } from '@mikro-orm/core';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { Account, EntityId, PermissionService, Role, School, User } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { AccountRepo } from '@shared/repo/account';
import { accountFactory, schoolFactory, setupEntities, userFactory } from '@shared/testing';
import { AccountUc } from './account.uc';

describe('AccountUc', () => {
	let module: TestingModule;
	let accountUc: AccountUc;
	let orm: MikroORM;

	let mockSchool: School;
	let mockotherSchool: School;

	let mockSuperheroUser: User;
	let mockAdminUser: User;
	let mockTeacherUser: User;
	let mockOtherTeacherUser: User;
	let mockStudentUser: User;
	let mockDifferentSchoolAdminUser: User;

	let mockSuperheroAccount: Account;
	let mockTeacherAccount: Account;
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
							if (userId === mockStudentAccount.user.id) {
								return Promise.resolve(mockStudentAccount);
							}
							if (userId === mockOtherTeacherAccount.user.id) {
								return Promise.resolve(mockOtherTeacherAccount);
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
							if (userId === mockStudentAccount.user.id) {
								return Promise.resolve(mockStudentAccount.user);
							}
							if (userId === mockOtherTeacherAccount.user.id) {
								return Promise.resolve(mockOtherTeacherAccount.user);
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
		mockSchool = schoolFactory.buildWithId();
		mockotherSchool = schoolFactory.buildWithId();

		mockSuperheroUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [new Role({ name: 'superhero', permissions: ['TEACHER_EDIT', 'STUDENT_EDIT'] })],
		});
		mockAdminUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [new Role({ name: 'admin', permissions: ['TEACHER_EDIT', 'STUDENT_EDIT'] })],
		});
		mockTeacherUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [new Role({ name: 'teacher', permissions: ['STUDENT_EDIT'] })],
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
			school: mockotherSchool,
			roles: [new Role({ name: 'admin', permissions: ['TEACHER_EDIT', 'STUDENT_EDIT'] })],
		});

		mockSuperheroAccount = accountFactory.buildWithId({ user: mockSuperheroUser, password: 'hjkl' });
		mockTeacherAccount = accountFactory.buildWithId({ user: mockTeacherUser, password: 'asdf' });
		mockOtherTeacherAccount = accountFactory.buildWithId({ user: mockOtherTeacherUser, password: 'uiop' });
		mockAdminAccount = accountFactory.buildWithId({ user: mockAdminUser, password: 'qwer' });
		mockStudentAccount = accountFactory.buildWithId({ user: mockStudentUser, password: '1234' });
		mockDifferentSchoolAdminAccount = accountFactory.buildWithId({
			user: mockDifferentSchoolAdminUser,
			password: 'yxcv',
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
