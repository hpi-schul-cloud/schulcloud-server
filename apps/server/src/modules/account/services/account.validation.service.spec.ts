import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { Account, Role, User } from '@shared/domain/entity';
import { Permission, RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { UserRepo } from '@shared/repo';
import { accountFactory, setupEntities, systemEntityFactory, userFactory } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { AccountRepo } from '../repo/account.repo';
import { AccountValidationService } from './account.validation.service';

describe('AccountValidationService', () => {
	let module: TestingModule;
	let accountValidationService: AccountValidationService;

	let mockTeacherUser: User;
	let mockTeacherAccount: Account;

	let mockStudentUser: User;
	let mockStudentAccount: Account;

	let mockOtherTeacherUser: User;
	let mockOtherTeacherAccount: Account;

	let mockAdminUser: User;

	let mockExternalUser: User;
	let mockExternalUserAccount: Account;
	let mockOtherExternalUser: User;
	let mockOtherExternalUserAccount: Account;

	let oprhanAccount: Account;

	let mockUsers: User[];
	let mockAccounts: Account[];

	afterAll(async () => {
		await module.close();
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
						findById: jest.fn().mockImplementation((userId: EntityId): Promise<User> => {
							const user = mockUsers.find((tempUser) => tempUser.id === userId);
							if (user) {
								return Promise.resolve(user);
							}
							throw new EntityNotFoundError(User.name);
						}),
						findByEmail: jest.fn().mockImplementation((email: string): Promise<User[]> => {
							const user = mockUsers.find((tempUser) => tempUser.email === email);

							if (user) {
								return Promise.resolve([user]);
							}
							if (email === 'multiple@user.email') {
								return Promise.resolve(mockUsers);
							}
							return Promise.resolve([]);
						}),
					},
				},
			],
		}).compile();

		accountValidationService = module.get(AccountValidationService);
		await setupEntities();
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
		mockExternalUser = userFactory.buildWithId({
			roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
		});
		mockOtherExternalUser = userFactory.buildWithId({
			roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
		});

		mockTeacherAccount = accountFactory.buildWithId({ userId: mockTeacherUser.id });
		mockStudentAccount = accountFactory.buildWithId({ userId: mockStudentUser.id });
		mockOtherTeacherAccount = accountFactory.buildWithId({
			userId: mockOtherTeacherUser.id,
		});
		const externalSystemA = systemEntityFactory.buildWithId();
		const externalSystemB = systemEntityFactory.buildWithId();
		mockExternalUserAccount = accountFactory.buildWithId({
			userId: mockExternalUser.id,
			username: 'unique.within@system',
			systemId: externalSystemA.id,
		});
		mockOtherExternalUserAccount = accountFactory.buildWithId({
			userId: mockOtherExternalUser.id,
			username: 'unique.within@system',
			systemId: externalSystemB.id,
		});

		oprhanAccount = accountFactory.buildWithId({
			username: 'orphan@account',
			userId: undefined,
			systemId: new ObjectId(),
		});

		mockAccounts = [
			mockTeacherAccount,
			mockStudentAccount,
			mockOtherTeacherAccount,
			mockExternalUserAccount,
			mockOtherExternalUserAccount,
			oprhanAccount,
		];
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
		mockUsers = [
			mockTeacherUser,
			mockStudentUser,
			mockOtherTeacherUser,
			mockAdminUser,
			mockExternalUser,
			mockOtherExternalUser,
		];
	});

	describe('isUniqueEmail', () => {
		it('should return true if new email is available', async () => {
			const res = await accountValidationService.isUniqueEmail('an@available.email');
			expect(res).toBe(true);
		});
		it('should return true if new email is available and ignore current user', async () => {
			const res = await accountValidationService.isUniqueEmail(mockStudentUser.email, mockStudentUser.id);
			expect(res).toBe(true);
		});
		it('should return true if new email is available and ignore current users account', async () => {
			const res = await accountValidationService.isUniqueEmail(
				mockStudentAccount.username,
				mockStudentUser.id,
				mockStudentAccount.id
			);
			expect(res).toBe(true);
		});
		it('should return false if new email already in use by another user', async () => {
			const res = await accountValidationService.isUniqueEmail(
				mockAdminUser.email,
				mockStudentUser.id,
				mockStudentAccount.id
			);
			expect(res).toBe(false);
		});
		it('should return false if new email is already in use by any user, system id is given', async () => {
			const res = await accountValidationService.isUniqueEmail(
				mockTeacherAccount.username,
				mockStudentUser.id,
				mockStudentAccount.id,
				mockStudentAccount.systemId?.toString()
			);
			expect(res).toBe(false);
		});
		it('should return false if new email already in use by multiple users', async () => {
			const res = await accountValidationService.isUniqueEmail(
				'multiple@user.email',
				mockStudentUser.id,
				mockStudentAccount.id,
				mockStudentAccount.systemId?.toString()
			);
			expect(res).toBe(false);
		});
		it('should return false if new email already in use by multiple accounts', async () => {
			const res = await accountValidationService.isUniqueEmail(
				'multiple@account.username',
				mockStudentUser.id,
				mockStudentAccount.id,
				mockStudentAccount.systemId?.toString()
			);
			expect(res).toBe(false);
		});
		it('should ignore existing username if other system', async () => {
			const res = await accountValidationService.isUniqueEmail(
				mockExternalUser.email,
				mockExternalUser.id,
				mockExternalUserAccount.id,
				mockOtherExternalUserAccount.systemId?.toString()
			);
			expect(res).toBe(true);
		});
	});

	describe('isUniqueEmailForUser', () => {
		it('should return true, if its the email of the given user', async () => {
			const res = await accountValidationService.isUniqueEmailForUser(mockStudentUser.email, mockStudentUser.id);
			expect(res).toBe(true);
		});
		it('should return false, if not the given users email', async () => {
			const res = await accountValidationService.isUniqueEmailForUser(mockStudentUser.email, mockAdminUser.id);
			expect(res).toBe(false);
		});
	});

	describe('isUniqueEmailForAccount', () => {
		it('should return true, if its the email of the given user', async () => {
			const res = await accountValidationService.isUniqueEmailForAccount(mockStudentUser.email, mockStudentAccount.id);
			expect(res).toBe(true);
		});
		it('should return false, if not the given users email', async () => {
			const res = await accountValidationService.isUniqueEmailForAccount(mockStudentUser.email, mockTeacherAccount.id);
			expect(res).toBe(false);
		});
		it('should ignore missing user for a given account', async () => {
			const res = await accountValidationService.isUniqueEmailForAccount(oprhanAccount.username, oprhanAccount.id);
			expect(res).toBe(true);
		});
	});
});
