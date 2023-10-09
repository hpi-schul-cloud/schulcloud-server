import { Test, TestingModule } from '@nestjs/testing';
import { Permission, Role, RoleName } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { accountFactory, setupEntities, systemFactory, userFactory } from '@shared/testing';
import { ObjectId } from 'bson';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { AccountRepo } from '../repo/account.repo';
import { AccountValidationService } from './account.validation.service';

describe('AccountValidationService', () => {
	let module: TestingModule;
	let accountValidationService: AccountValidationService;

	let userRepo: DeepMocked<UserRepo>;
	let accountRepo: DeepMocked<AccountRepo>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AccountValidationService,
				{
					provide: AccountRepo,
					useValue: createMock<AccountRepo>(),
				},
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
			],
		}).compile();

		accountValidationService = module.get(AccountValidationService);

		userRepo = module.get(UserRepo);
		accountRepo = module.get(AccountRepo);

		await setupEntities();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('isUniqueEmail', () => {
		describe('When new email is available', () => {
			const setup = () => {
				userRepo.findByEmail.mockResolvedValueOnce([]);
				accountRepo.searchByUsernameExactMatch.mockResolvedValueOnce([[], 0]);
			};
			it('should return true', async () => {
				setup();

				const res = await accountValidationService.isUniqueEmail('an@available.email');
				expect(res).toBe(true);
			});
		});

		describe('When new email is available', () => {
			const setup = () => {
				const mockStudentUser = userFactory.buildWithId({
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});

				userRepo.findByEmail.mockResolvedValueOnce([mockStudentUser]);
				accountRepo.searchByUsernameExactMatch.mockResolvedValueOnce([[], 0]);

				return { mockStudentUser };
			};
			it('should return true and ignore current user', async () => {
				const { mockStudentUser } = setup();
				const res = await accountValidationService.isUniqueEmail(mockStudentUser.email, mockStudentUser.id);
				expect(res).toBe(true);
			});
		});

		describe('When new email is available', () => {
			const setup = () => {
				const mockStudentUser = userFactory.buildWithId({
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});

				const mockStudentAccount = accountFactory.buildWithId({ userId: mockStudentUser.id });

				userRepo.findByEmail.mockResolvedValueOnce([mockStudentUser]);
				accountRepo.searchByUsernameExactMatch.mockResolvedValueOnce([[mockStudentAccount], 1]);

				return { mockStudentUser, mockStudentAccount };
			};
			it('should return true and ignore current users account', async () => {
				const { mockStudentUser, mockStudentAccount } = setup();
				const res = await accountValidationService.isUniqueEmail(
					mockStudentAccount.username,
					mockStudentUser.id,
					mockStudentAccount.id
				);
				expect(res).toBe(true);
			});
		});

		describe('When new email already in use by another user', () => {
			const setup = () => {
				const mockStudentUser = userFactory.buildWithId({
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockAdminUser = userFactory.buildWithId({
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
				const mockAdminAccount = accountFactory.buildWithId({ userId: mockAdminUser.id });
				const mockStudentAccount = accountFactory.buildWithId({ userId: mockStudentUser.id });

				userRepo.findByEmail.mockResolvedValueOnce([mockAdminUser]);
				accountRepo.searchByUsernameExactMatch.mockResolvedValueOnce([[mockAdminAccount], 1]);

				return { mockAdminUser, mockStudentUser, mockStudentAccount };
			};
			it('should return false', async () => {
				const { mockAdminUser, mockStudentUser, mockStudentAccount } = setup();
				const res = await accountValidationService.isUniqueEmail(
					mockAdminUser.email,
					mockStudentUser.id,
					mockStudentAccount.id
				);
				expect(res).toBe(false);
			});
		});

		describe('When new email already in use by any user and system id is given', () => {
			const setup = () => {
				const mockTeacherUser = userFactory.buildWithId({
					roles: [new Role({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] })],
				});
				const mockStudentUser = userFactory.buildWithId({
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});

				const mockTeacherAccount = accountFactory.buildWithId({ userId: mockTeacherUser.id });
				const mockStudentAccount = accountFactory.buildWithId({ userId: mockStudentUser.id });

				userRepo.findByEmail.mockResolvedValueOnce([mockTeacherUser]);
				accountRepo.searchByUsernameExactMatch.mockResolvedValueOnce([[mockTeacherAccount], 1]);

				return { mockTeacherAccount, mockStudentUser, mockStudentAccount };
			};
			it('should return false', async () => {
				const { mockTeacherAccount, mockStudentUser, mockStudentAccount } = setup();
				const res = await accountValidationService.isUniqueEmail(
					mockTeacherAccount.username,
					mockStudentUser.id,
					mockStudentAccount.id,
					mockStudentAccount.systemId?.toString()
				);
				expect(res).toBe(false);
			});
		});

		describe('When new email already in use by multiple users', () => {
			const setup = () => {
				const mockTeacherUser = userFactory.buildWithId({
					roles: [new Role({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] })],
				});
				const mockStudentUser = userFactory.buildWithId({
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockOtherTeacherUser = userFactory.buildWithId({
					roles: [
						new Role({
							name: RoleName.TEACHER,
							permissions: [Permission.STUDENT_EDIT, Permission.STUDENT_LIST, Permission.TEACHER_LIST],
						}),
					],
				});
				const mockStudentAccount = accountFactory.buildWithId({ userId: mockStudentUser.id });

				const mockUsers = [mockTeacherUser, mockStudentUser, mockOtherTeacherUser];

				userRepo.findByEmail.mockResolvedValueOnce(mockUsers);
				accountRepo.searchByUsernameExactMatch.mockResolvedValueOnce([[], 0]);

				return { mockStudentUser, mockStudentAccount };
			};
			it('should return false', async () => {
				const { mockStudentUser, mockStudentAccount } = setup();
				const res = await accountValidationService.isUniqueEmail(
					'multiple@user.email',
					mockStudentUser.id,
					mockStudentAccount.id,
					mockStudentAccount.systemId?.toString()
				);
				expect(res).toBe(false);
			});
		});

		describe('When new email already in use by multiple accounts', () => {
			const setup = () => {
				const mockTeacherUser = userFactory.buildWithId({
					roles: [new Role({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] })],
				});
				const mockStudentUser = userFactory.buildWithId({
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockOtherTeacherUser = userFactory.buildWithId({
					roles: [
						new Role({
							name: RoleName.TEACHER,
							permissions: [Permission.STUDENT_EDIT, Permission.STUDENT_LIST, Permission.TEACHER_LIST],
						}),
					],
				});

				const mockTeacherAccount = accountFactory.buildWithId({ userId: mockTeacherUser.id });
				const mockStudentAccount = accountFactory.buildWithId({ userId: mockStudentUser.id });
				const mockOtherTeacherAccount = accountFactory.buildWithId({
					userId: mockOtherTeacherUser.id,
				});

				const mockAccounts = [mockTeacherAccount, mockStudentAccount, mockOtherTeacherAccount];
				userRepo.findByEmail.mockResolvedValueOnce([]);
				accountRepo.searchByUsernameExactMatch.mockResolvedValueOnce([mockAccounts, mockAccounts.length]);

				return { mockStudentUser, mockStudentAccount };
			};
			it('should return false', async () => {
				const { mockStudentUser, mockStudentAccount } = setup();
				const res = await accountValidationService.isUniqueEmail(
					'multiple@account.username',
					mockStudentUser.id,
					mockStudentAccount.id,
					mockStudentAccount.systemId?.toString()
				);
				expect(res).toBe(false);
			});
		});

		describe('When its another system', () => {
			const setup = () => {
				const mockExternalUser = userFactory.buildWithId({
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockOtherExternalUser = userFactory.buildWithId({
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});

				const externalSystemA = systemFactory.buildWithId();
				const externalSystemB = systemFactory.buildWithId();
				const mockExternalUserAccount = accountFactory.buildWithId({
					userId: mockExternalUser.id,
					username: 'unique.within@system',
					systemId: externalSystemA.id,
				});
				const mockOtherExternalUserAccount = accountFactory.buildWithId({
					userId: mockOtherExternalUser.id,
					username: 'unique.within@system',
					systemId: externalSystemB.id,
				});

				userRepo.findByEmail.mockResolvedValueOnce([mockExternalUser]);
				accountRepo.searchByUsernameExactMatch.mockResolvedValueOnce([[mockExternalUserAccount], 1]);

				return { mockExternalUser, mockExternalUserAccount, mockOtherExternalUserAccount };
			};
			it('should ignore existing username', async () => {
				const { mockExternalUser, mockExternalUserAccount, mockOtherExternalUserAccount } = setup();
				const res = await accountValidationService.isUniqueEmail(
					mockExternalUser.email,
					mockExternalUser.id,
					mockExternalUserAccount.id,
					mockOtherExternalUserAccount.systemId?.toString()
				);
				expect(res).toBe(true);
			});
		});
	});

	describe('isUniqueEmailForUser', () => {
		describe('When its the email of the given user', () => {
			const setup = () => {
				const mockStudentUser = userFactory.buildWithId({
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});

				const mockStudentAccount = accountFactory.buildWithId({ userId: mockStudentUser.id });

				userRepo.findByEmail.mockResolvedValueOnce([mockStudentUser]);
				accountRepo.searchByUsernameExactMatch.mockResolvedValueOnce([[mockStudentAccount], 1]);
				accountRepo.findByUserId.mockResolvedValueOnce(mockStudentAccount);

				return { mockStudentUser };
			};
			it('should return true', async () => {
				const { mockStudentUser } = setup();
				const res = await accountValidationService.isUniqueEmailForUser(mockStudentUser.email, mockStudentUser.id);
				expect(res).toBe(true);
			});
		});

		describe('When its not the given users email', () => {
			const setup = () => {
				const mockStudentUser = userFactory.buildWithId({
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});

				const mockStudentAccount = accountFactory.buildWithId({ userId: mockStudentUser.id });

				const mockAdminUser = userFactory.buildWithId({
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
				const mockAdminAccount = accountFactory.buildWithId({ userId: mockAdminUser.id });

				userRepo.findByEmail.mockResolvedValueOnce([mockStudentUser]);
				accountRepo.searchByUsernameExactMatch.mockResolvedValueOnce([[mockStudentAccount], 1]);
				accountRepo.findByUserId.mockResolvedValueOnce(mockAdminAccount);

				return { mockStudentUser, mockAdminUser };
			};
			it('should return false', async () => {
				const { mockStudentUser, mockAdminUser } = setup();
				const res = await accountValidationService.isUniqueEmailForUser(mockStudentUser.email, mockAdminUser.id);
				expect(res).toBe(false);
			});
		});
	});

	describe('isUniqueEmailForAccount', () => {
		describe('When its the email of the given user', () => {
			const setup = () => {
				const mockStudentUser = userFactory.buildWithId({
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});

				const mockStudentAccount = accountFactory.buildWithId({ userId: mockStudentUser.id });

				userRepo.findByEmail.mockResolvedValueOnce([mockStudentUser]);
				accountRepo.searchByUsernameExactMatch.mockResolvedValueOnce([[mockStudentAccount], 1]);
				accountRepo.findById.mockResolvedValueOnce(mockStudentAccount);

				return { mockStudentUser, mockStudentAccount };
			};
			it('should return true', async () => {
				const { mockStudentUser, mockStudentAccount } = setup();
				const res = await accountValidationService.isUniqueEmailForAccount(
					mockStudentUser.email,
					mockStudentAccount.id
				);
				expect(res).toBe(true);
			});
		});
		describe('When its not the given users email', () => {
			const setup = () => {
				const mockTeacherUser = userFactory.buildWithId({
					roles: [new Role({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] })],
				});
				const mockStudentUser = userFactory.buildWithId({
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});

				const mockTeacherAccount = accountFactory.buildWithId({ userId: mockTeacherUser.id });
				const mockStudentAccount = accountFactory.buildWithId({ userId: mockStudentUser.id });

				userRepo.findByEmail.mockResolvedValueOnce([mockStudentUser]);
				accountRepo.searchByUsernameExactMatch.mockResolvedValueOnce([[mockStudentAccount], 1]);
				accountRepo.findById.mockResolvedValueOnce(mockTeacherAccount);

				return { mockStudentUser, mockTeacherAccount };
			};
			it('should return false', async () => {
				const { mockStudentUser, mockTeacherAccount } = setup();
				const res = await accountValidationService.isUniqueEmailForAccount(
					mockStudentUser.email,
					mockTeacherAccount.id
				);
				expect(res).toBe(false);
			});
		});

		describe('When user is missing in account', () => {
			const setup = () => {
				const oprhanAccount = accountFactory.buildWithId({
					username: 'orphan@account',
					userId: undefined,
					systemId: new ObjectId(),
				});

				userRepo.findByEmail.mockResolvedValueOnce([]);
				accountRepo.searchByUsernameExactMatch.mockResolvedValueOnce([[], 0]);
				accountRepo.findById.mockResolvedValueOnce(oprhanAccount);

				return { oprhanAccount };
			};
			it('should ignore missing user for given account', async () => {
				const { oprhanAccount } = setup();
				const res = await accountValidationService.isUniqueEmailForAccount(oprhanAccount.username, oprhanAccount.id);
				expect(res).toBe(true);
			});
		});
	});
});
