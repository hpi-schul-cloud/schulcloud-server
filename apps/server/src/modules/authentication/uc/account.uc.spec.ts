import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { Account, EntityId, PermissionService, Role, School, User } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { AccountRepo } from '@shared/repo/account';
import { setupEntities } from '@shared/testing';
import { AccountUc } from './account.uc';

describe('AccountUc', () => {
	let module: TestingModule;
	let accountUc: AccountUc;
	let orm: MikroORM;

	let mockSchool: School;
	let mockotherSchool: School;
	let mockAdminUser: User;
	let mockTeacherUser: User;
	let mockStudentUser: User;
	let mockDifferentSchoolAdminUser: User;
	let mockTeacherAccount: Account;
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
							if (userId === mockAdminAccount.user.id) {
								return Promise.resolve(mockAdminAccount);
							}
							if (userId === mockTeacherAccount.user.id) {
								return Promise.resolve(mockTeacherAccount);
							}
							if (userId === mockStudentAccount.user.id) {
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
							if (userId === mockAdminAccount.user.id) {
								return Promise.resolve(mockAdminAccount.user);
							}
							if (userId === mockTeacherAccount.user.id) {
								return Promise.resolve(mockTeacherAccount.user);
							}
							if (userId === mockStudentAccount.user.id) {
								return Promise.resolve(mockStudentAccount.user);
							}
							throw Error();
						},
						update: (user: User): Promise<User> => {
							return Promise.resolve(user);
						},
					},
				},
				{
					provide: PermissionService,
					useValue: {
						hasUserAllSchoolPermissions: () => true,
					},
				},
			],
		}).compile();

		accountUc = module.get(AccountUc);
		orm = await setupEntities();
		mockSchool = new School({ name: 'Ankh Morpork Guard' });
		mockSchool.id = 'school-AMGxx';
		mockotherSchool = new School({ name: 'Borogravian Army' });
		mockotherSchool.id = 'school-BAxxx';
		mockAdminUser = new User({
			firstName: 'Samuel',
			lastName: 'Vimes',
			email: 'samuel.vimes@watch.am',
			school: mockSchool,
			roles: [new Role({ name: 'admin', permissions: ['TEACHER_EDIT', 'STUDENT_EDIT'] })],
		});
		mockAdminUser.id = 'user-adminxx';
		mockTeacherUser = new User({
			firstName: 'Carrot',
			lastName: 'Ironfoundersson',
			email: 'carrot.ironfoundersson@watch.am',
			school: mockSchool,
			roles: [new Role({ name: 'teacher', permissions: ['STUDENT_EDIT'] })],
		});
		mockTeacherUser.id = 'user-teacher';
		mockStudentUser = new User({
			firstName: 'Nobby',
			lastName: 'Nobbs',
			email: 'nobby.nobbs@watch.am',
			school: mockSchool,
			roles: [new Role({ name: 'student', permissions: [] })],
		});
		mockStudentUser.id = 'user-student';
		mockDifferentSchoolAdminUser = new User({
			firstName: 'Jack',
			lastName: 'Jackrum',
			email: 'jack.jackrum@army.bo',
			school: mockotherSchool,
			roles: [new Role({ name: 'admin', permissions: ['TEACHER_EDIT', 'STUDENT_EDIT'] })],
		});
		mockDifferentSchoolAdminUser.id = 'user-diffAdm';

		mockTeacherAccount = new Account({ user: mockTeacherUser, username: 'carrot.ironfoundersson@watch.am' });
		mockTeacherAccount.id = 'acc-teacherx';
		mockTeacherAccount.password = 'asdf';

		mockAdminAccount = new Account({ user: mockAdminUser, username: 'samuel.vimes@watch.am' });
		mockAdminAccount.id = 'acc-adminxxx';
		mockAdminAccount.password = 'qwer';

		mockStudentAccount = new Account({ user: mockStudentUser, username: 'nobby.nobbs@watch.am' });
		mockStudentAccount.id = 'acc-studentx';
		mockAdminAccount.password = '1234';

		mockDifferentSchoolAdminAccount = new Account({
			user: mockDifferentSchoolAdminUser,
			username: 'jack.jackrum@army.bo',
		});
		mockDifferentSchoolAdminAccount.id = 'acc-difAdmin';
		mockAdminAccount.password = 'yxcv';
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
			const previousPasswordHash = mockAdminAccount.password;
			expect(mockAdminAccount.user.forcePasswordChange).toBeFalsy();
			await accountUc.changePasswordForUser(mockAdminUser.id, mockTeacherUser.id, 'DummyPasswd!1');
			expect(mockTeacherAccount.password).not.toBe(previousPasswordHash);
			expect(mockTeacherUser.forcePasswordChange).toBe(true);
		});

		// TODO check authentification / authorization
	});
});
