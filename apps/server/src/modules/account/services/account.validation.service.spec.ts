import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { Account, EntityId, Permission, Role, RoleName, User } from '@shared/domain';
import { AccountRepo, UserRepo } from '@shared/repo';
import { setupEntities, userFactory, accountFactory } from '@shared/testing';
import { AccountValidationService } from './account.validation.service';

describe('AccountValidationService', () => {
	let module: TestingModule;
	let accountValidationService: AccountValidationService;
	let orm: MikroORM;
	let accountRepo: AccountRepo;
	let userRepo: UserRepo;

	let mockUsers: User[];
	let mockTeacherUser: User;
	let mockStudentUser: User;
	let mockExternalUser: User;
	let mockAccounts: Account[];
	let mockTeacherAccount: Account;
	let mockStudentAccount: Account;
	let mockAdminUser: User;
	let mockOtherTeacherAccount: Account;
	let mockOtherTeacherUser: User;

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AccountValidationService,
				{
					provide: AccountRepo,
					useValue: {
						findById: jest.fn().mockImplementation((accountId: EntityId): Promise<Account> => {
							const account = mockAccounts.find((tempAccount) => tempAccount.id === accountId);

							if (account) {
								return Promise.resolve(account);
							}
							throw new EntityNotFoundError(Account.name);
						}),

						searchByUsernameExactMatch: jest
							.fn()
							.mockImplementation((username: string): Promise<[Account[], number]> => {
								const account = mockAccounts.find((tempAccount) => tempAccount.username === username);

								if (account) {
									return Promise.resolve([[account], 1]);
								}
								if (username === 'not@available.username') {
									return Promise.resolve([[mockOtherTeacherAccount], 1]);
								}
								if (username === 'multiple@account.username') {
									return Promise.resolve([mockAccounts, mockAccounts.length]);
								}
								return Promise.resolve([[], 0]);
							}),
						findByUserId: (userId: EntityId): Promise<Account | null> => {
							const account = mockAccounts.find((tempAccount) => tempAccount.userId?.toString() === userId);
							if (account) {
								return Promise.resolve(account);
							}
							return Promise.resolve(null);
						},
					},
				},
				{
					provide: UserRepo,
					useValue: {
						findByEmail: (email: string): Promise<User[]> => {
							const user = mockUsers.find((tempUser) => tempUser.email === email);

							if (user) {
								return Promise.resolve([user]);
							}
							if (email === 'not@available.email') {
								return Promise.resolve([mockExternalUser]);
							}
							if (email === 'multiple@user.email') {
								return Promise.resolve(mockUsers);
							}
							return Promise.resolve([]);
						},
					},
				},
			],
		}).compile();

		accountRepo = module.get(AccountRepo);
		userRepo = module.get(UserRepo);
		accountValidationService = module.get(AccountValidationService);
		orm = await setupEntities();
	});

	beforeEach(() => {
		mockTeacherUser = userFactory.buildWithId({
			roles: [new Role({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] })],
		});
		mockStudentUser = userFactory.buildWithId({
			roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
		});
		mockOtherTeacherUser = userFactory.buildWithId({
			roles: [
				new Role({
					name: RoleName.TEACHER,
					permissions: [Permission.STUDENT_EDIT, Permission.STUDENT_LIST, Permission.TEACHER_LIST],
				}),
			],
		});

		mockTeacherAccount = accountFactory.buildWithId({ userId: mockTeacherUser.id });
		mockStudentAccount = accountFactory.buildWithId({ userId: mockStudentUser.id });
		mockOtherTeacherAccount = accountFactory.buildWithId({
			userId: mockOtherTeacherUser.id,
		});

		mockAccounts = [mockTeacherAccount, mockStudentAccount];
		mockAdminUser = userFactory.buildWithId({
			roles: [
				new Role({
					name: RoleName.ADMINISTRATOR,
					permissions: [
						Permission.TEACHER_EDIT,
						Permission.STUDENT_EDIT,
						Permission.STUDENT_LIST,
						Permission.TEACHER_LIST,
						Permission.TEACHER_CREATE,
						Permission.STUDENT_CREATE,
						Permission.TEACHER_DELETE,
						Permission.STUDENT_DELETE,
					],
				}),
			],
		});
		mockUsers = [mockTeacherUser, mockStudentUser];
	});

	describe('isUniqueEmail', () => {
		it('should return true if new email is available', async () => {
			const res = await accountValidationService.isUniqueEmail('an@available.email', mockStudentUser.id);
			expect(res).toBe(true);
		});

		it('should return true if new email is available and ignore current user', async () => {
			const res = await accountValidationService.isUniqueEmail(mockStudentUser.email, mockStudentUser.id);
			expect(res).toBe(true);
		});
		it('should return true if new email is available and ignore current users account', async () => {
			const res = await accountValidationService.isUniqueEmail(mockStudentAccount.username, mockStudentUser.id);
			expect(res).toBe(true);
		});
		it('should return false if new email already in use by another user', async () => {
			const res = await accountValidationService.isUniqueEmail(mockAdminUser.email, mockStudentUser.id);
			expect(res).toBe(false);
		});
		xit('should return false if new email already in use by another user ignore case', async () => {
			const res = await accountValidationService.isUniqueEmail(mockAdminUser.email.toUpperCase(), mockStudentUser.id);
			expect(res).toBe(false);
		});
		it('should return false if new email is already in use by any user', async () => {
			const res = await accountValidationService.isUniqueEmail(mockStudentAccount.username);
			expect(res).toBe(false);
		});
		it('should return false if new email already in use by another user', async () => {
			const res = await accountValidationService.isUniqueEmail('not@available.email', mockStudentUser.id);
			expect(res).toBe(false);
		});
		it('should return false if new email already in use by another account', async () => {
			const res = await accountValidationService.isUniqueEmail('not@available.username', mockStudentUser.id);
			expect(res).toBe(false);
		});
		it('should return false if new email already in use by multiple users', async () => {
			const res = await accountValidationService.isUniqueEmail('multiple@user.email', mockStudentUser.id);
			expect(res).toBe(false);
		});
		it('should return false if new email already in use by multiple accounts', async () => {
			const res = await accountValidationService.isUniqueEmail('multiple@account.username', mockStudentUser.id);
			expect(res).toBe(false);
		});
	});
});
