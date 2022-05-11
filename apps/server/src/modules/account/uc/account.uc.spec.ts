import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationError, EntityNotFoundError, ForbiddenOperationError, ValidationError } from '@shared/common';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountDto } from '@src/modules/account/services/dto/account.dto';
import {
	Account,
	EntityId,
	ICurrentUser,
	Permission,
	PermissionService,
	Role,
	RoleName,
	School,
	User,
} from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { accountFactory, schoolFactory, setupEntities, systemFactory, userFactory } from '@shared/testing';
import {
	AccountByIdBodyParams,
	AccountByIdParams,
	AccountSearchListResponse,
	AccountSearchQueryParams,
	AccountSearchType,
} from '../controller/dto';
import { AccountEntityToDtoMapper } from '../mapper/account-entity-to-dto.mapper';
import { AccountResponseMapper } from '../mapper/account-response.mapper';

import { AccountUc } from './account.uc';

describe('AccountUc', () => {
	let module: TestingModule;
	let accountUc: AccountUc;
	let userRepo: UserRepo;
	let accountService: AccountService;
	let orm: MikroORM;

	let mockSchool: School;
	let mockOtherSchool: School;

	let mockSuperheroUser: User;
	let mockAdminUser: User;
	let mockTeacherUser: User;
	let mockOtherTeacherUser: User;
	let mockStudentUser: User;
	let mockDifferentSchoolAdminUser: User;
	let mockUnknownRoleUser: User;
	let mockExternalUser: User;
	let mockUserWithoutAccount: User;
	let mockUserWithoutRole: User;

	let mockSuperheroAccount: Account;
	let mockTeacherAccount: Account;
	let mockOtherTeacherAccount: Account;
	let mockAdminAccount: Account;
	let mockStudentAccount: Account;
	let mockDifferentSchoolAdminAccount: Account;
	let mockUnknownRoleUserAccount: Account;
	let mockExternalUserAccount: Account;
	let mockAccountWithoutRole: Account;
	let mockAccounts: Account[];
	let mockUsers: User[];

	const defaultPassword = 'DummyPasswd!1';
	const defaultPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AccountUc,
				{
					provide: AccountService,
					useValue: {
						save: jest.fn().mockImplementation((account: AccountDto): Promise<void> => {
							if (account.username === 'fail@to.update') {
								return Promise.reject();
							}
							const accountEntity = mockAccounts.find((tempAccount) => tempAccount.userId === account.userId);
							Object.assign(accountEntity, account);

							return Promise.resolve();
						}),
						delete: (account: AccountDto): Promise<AccountDto> => {
							return Promise.resolve(account);
						},
						findByUserId: (userId: EntityId): Promise<AccountDto | null> => {
							const account = mockAccounts.find((tempAccount) => tempAccount.userId === userId);

							if (account) {
								return Promise.resolve(AccountEntityToDtoMapper.mapToDto(account));
							}
							return Promise.resolve(null);
						},
						findByUserIdOrFail: (userId: EntityId): Promise<AccountDto> => {
							const account = mockAccounts.find((tempAccount) => tempAccount.userId === userId);

							if (account) {
								return Promise.resolve(AccountEntityToDtoMapper.mapToDto(account));
							}
							if (userId === 'accountWithoutUser') {
								return Promise.resolve(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));
							}
							throw new EntityNotFoundError(Account.name);
						},
						findById: (accountId: EntityId): Promise<AccountDto> => {
							const account = mockAccounts.find((tempAccount) => tempAccount.id === accountId);

							if (account) {
								return Promise.resolve(AccountEntityToDtoMapper.mapToDto(account));
							}
							throw new EntityNotFoundError(Account.name);
						},
						searchByUsernameExactMatch: (username: string): Promise<{ accounts: AccountDto[]; total: number }> => {
							const account = mockAccounts.find((tempAccount) => tempAccount.username === username);

							if (account) {
								return Promise.resolve({ accounts: [AccountEntityToDtoMapper.mapToDto(account)], total: 1 });
							}
							if (username === 'not@available.username') {
								return Promise.resolve({
									accounts: [AccountEntityToDtoMapper.mapToDto(mockExternalUserAccount)],
									total: 1,
								});
								// return Promise.resolve([[mockExternalUserAccount], mockAccounts.length]);
							}
							if (username === 'multiple@account.username') {
								return Promise.resolve({
									accounts: mockAccounts.map((mockAccount) => AccountEntityToDtoMapper.mapToDto(mockAccount)),
									total: mockAccounts.length,
								});
							}
							return Promise.resolve({
								accounts: [],
								total: 0,
							});
						},
						searchByUsernamePartialMatch: (): Promise<{ accounts: AccountDto[]; total: number }> => {
							return Promise.resolve({
								accounts: mockAccounts.map((mockAccount) => AccountEntityToDtoMapper.mapToDto(mockAccount)),
								total: mockAccounts.length,
							});
						},
					},
				},
				{
					provide: UserRepo,
					useValue: {
						findById: (userId: EntityId): Promise<User> => {
							const user = mockUsers.find((tempUser) => tempUser.id === userId);
							if (user) {
								return Promise.resolve(user);
							}
							throw new EntityNotFoundError(User.name);
						},
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
						save: jest.fn().mockImplementation((user: User): Promise<void> => {
							if (user.firstName === 'failToUpdate' || user.email === 'user-fail@to.update') {
								return Promise.reject();
							}
							return Promise.resolve();
						}),
					},
				},
				PermissionService,
			],
		}).compile();

		accountUc = module.get(AccountUc);
		userRepo = module.get(UserRepo);
		accountService = module.get(AccountService);
		orm = await setupEntities();
	});

	beforeEach(() => {
		mockSchool = schoolFactory.buildWithId();
		mockOtherSchool = schoolFactory.buildWithId();

		mockSuperheroUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [new Role({ name: RoleName.SUPERHERO, permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT] })],
		});
		mockAdminUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [
				new Role({ name: RoleName.ADMINISTRATOR, permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT] }),
			],
		});
		mockTeacherUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [new Role({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] })],
		});
		mockOtherTeacherUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [new Role({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] })],
		});
		mockStudentUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
		});
		mockDifferentSchoolAdminUser = userFactory.buildWithId({
			school: mockOtherSchool,
			roles: [
				new Role({ name: RoleName.ADMINISTRATOR, permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT] }),
			],
		});
		mockUserWithoutAccount = userFactory.buildWithId({
			school: mockSchool,
			roles: [
				new Role({ name: RoleName.ADMINISTRATOR, permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT] }),
			],
		});
		mockUserWithoutRole = userFactory.buildWithId({
			school: mockSchool,
			roles: [],
		});
		mockUnknownRoleUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [new Role({ name: 'undefinedRole' as RoleName, permissions: ['' as Permission] })],
		});
		mockExternalUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
		});

		mockSuperheroAccount = accountFactory.buildWithId({
			userId: mockSuperheroUser.id,
			password: defaultPasswordHash,
		});
		mockTeacherAccount = accountFactory.buildWithId({
			userId: mockTeacherUser.id,
			password: defaultPasswordHash,
		});
		mockOtherTeacherAccount = accountFactory.buildWithId({
			userId: mockOtherTeacherUser.id,
			password: defaultPasswordHash,
		});
		mockAdminAccount = accountFactory.buildWithId({
			userId: mockAdminUser.id,
			password: defaultPasswordHash,
		});
		mockStudentAccount = accountFactory.buildWithId({
			userId: mockStudentUser.id,
			password: defaultPasswordHash,
		});
		mockAccountWithoutRole = accountFactory.buildWithId({
			userId: mockUserWithoutRole.id,
			password: defaultPasswordHash,
		});
		mockDifferentSchoolAdminAccount = accountFactory.buildWithId({
			userId: mockDifferentSchoolAdminUser.id,
			password: defaultPasswordHash,
		});
		mockUnknownRoleUserAccount = accountFactory.buildWithId({
			userId: mockUnknownRoleUser.id,
			password: defaultPasswordHash,
		});
		mockExternalUserAccount = accountFactory.buildWithId({
			userId: mockExternalUser.id,
			password: defaultPasswordHash,
			systemId: systemFactory.buildWithId().id,
		});
		mockExternalUserAccount = accountFactory.buildWithId({
			userId: mockExternalUser.id,
			password: defaultPasswordHash,
			systemId: systemFactory.buildWithId().id,
		});

		mockUsers = [
			mockSuperheroUser,
			mockAdminUser,
			mockTeacherUser,
			mockOtherTeacherUser,
			mockStudentUser,
			mockDifferentSchoolAdminUser,
			mockUnknownRoleUser,
			mockExternalUser,
			mockUserWithoutRole,
			mockUserWithoutAccount,
		];

		mockAccounts = [
			mockSuperheroAccount,
			mockAdminAccount,
			mockTeacherAccount,
			mockOtherTeacherAccount,
			mockStudentAccount,
			mockDifferentSchoolAdminAccount,
			mockUnknownRoleUserAccount,
			mockExternalUserAccount,
			mockAccountWithoutRole,
		];
	});

	describe('updateMyAccount', () => {
		it('should throw if user does not exist', async () => {
			mockStudentUser.forcePasswordChange = true;
			mockStudentUser.preferences = { firstLogin: true };
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
				accountUc.updateMyAccount(mockExternalUserAccount.userId, {
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
			const accountSaveSpy = jest.spyOn(accountService, 'save');
			const testMail = 'AN@AVAILABLE.MAIL';
			await expect(
				accountUc.updateMyAccount(mockStudentUser.id, {
					passwordOld: defaultPassword,
					email: testMail,
				})
			).resolves.not.toThrow();
			expect(accountSaveSpy).toBeCalledWith(expect.objectContaining({ username: testMail.toLowerCase() }));
		});
		it('should use email as user email in lower case', async () => {
			const userUpdateSpy = jest.spyOn(userRepo, 'save');
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
			const accountSaveSpy = jest.spyOn(accountService, 'save');
			const userUpdateSpy = jest.spyOn(userRepo, 'save');
			const testMail = 'an@available.mail';
			await expect(
				accountUc.updateMyAccount(mockStudentUser.id, {
					passwordOld: defaultPassword,
					email: testMail,
				})
			).resolves.not.toThrow();
			expect(userUpdateSpy).toBeCalledWith(expect.objectContaining({ email: testMail.toLowerCase() }));
			expect(accountSaveSpy).toBeCalledWith(expect.objectContaining({ username: testMail.toLowerCase() }));
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
				accountUc.replaceMyTemporaryPassword(mockStudentAccount.userId, defaultPassword, 'FooPasswd!1')
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
				accountUc.replaceMyTemporaryPassword(mockExternalUserAccount.userId, defaultPassword, defaultPassword)
			).rejects.toThrow(ForbiddenOperationError);
		});
		it('should throw if not the users password is temporary', async () => {
			mockStudentUser.forcePasswordChange = false;
			mockStudentUser.preferences = { firstLogin: true };
			await expect(
				accountUc.replaceMyTemporaryPassword(mockStudentAccount.userId, defaultPassword, defaultPassword)
			).rejects.toThrow(ForbiddenOperationError);
		});
		it('should throw, if old password is the same as new password', async () => {
			mockStudentUser.forcePasswordChange = false;
			mockStudentUser.preferences = { firstLogin: false };
			await expect(
				accountUc.replaceMyTemporaryPassword(mockStudentAccount.userId, defaultPassword, defaultPassword)
			).rejects.toThrow(ForbiddenOperationError);
		});
		it('should throw, if old password is undefined', async () => {
			mockStudentUser.forcePasswordChange = false;
			mockStudentUser.preferences = { firstLogin: false };
			mockStudentAccount.password = undefined;
			await expect(
				accountUc.replaceMyTemporaryPassword(mockStudentAccount.userId, defaultPassword, defaultPassword)
			).rejects.toThrow(Error);
		});
		it('should allow to set strong password, if the admin manipulated the users password', async () => {
			mockStudentUser.forcePasswordChange = true;
			mockStudentUser.preferences = { firstLogin: true };
			await expect(
				accountUc.replaceMyTemporaryPassword(mockStudentAccount.userId, 'DummyPasswd!2', 'DummyPasswd!2')
			).resolves.not.toThrow();
		});
		it('should allow to set strong password, if this is the users first login', async () => {
			mockStudentUser.forcePasswordChange = false;
			mockStudentUser.preferences = { firstLogin: false };
			await expect(
				accountUc.replaceMyTemporaryPassword(mockStudentAccount.userId, 'DummyPasswd!2', 'DummyPasswd!2')
			).resolves.not.toThrow();
		});
		it('should throw if user can not be updated', async () => {
			mockStudentUser.forcePasswordChange = false;
			mockStudentUser.preferences = { firstLogin: false };
			mockStudentUser.firstName = 'failToUpdate';
			await expect(
				accountUc.replaceMyTemporaryPassword(mockStudentAccount.userId, 'DummyPasswd!2', 'DummyPasswd!2')
			).rejects.toThrow(EntityNotFoundError);
		});
		it('should throw if account can not be updated', async () => {
			mockStudentUser.forcePasswordChange = false;
			mockStudentUser.preferences = { firstLogin: false };
			mockStudentAccount.username = 'fail@to.update';
			await expect(
				accountUc.replaceMyTemporaryPassword(mockStudentAccount.userId, 'DummyPasswd!2', 'DummyPasswd!2')
			).rejects.toThrow(EntityNotFoundError);
		});
	});

	describe('searchAccounts', () => {
		it('should return one account, if search type is userId', async () => {
			const accounts = await accountUc.searchAccounts(
				{ userId: mockSuperheroUser.id } as ICurrentUser,
				{ type: AccountSearchType.USER_ID, value: mockStudentUser.id } as AccountSearchQueryParams
			);
			const expected = new AccountSearchListResponse(
				[AccountResponseMapper.mapToResponseFromEntity(mockStudentAccount)],
				1,
				0,
				1
			);
			expect(accounts).toStrictEqual<AccountSearchListResponse>(expected);
		});

		it('should return empty list, if account is not found', async () => {
			const accounts = await accountUc.searchAccounts(
				{ userId: mockSuperheroUser.id } as ICurrentUser,
				{ type: AccountSearchType.USER_ID, value: 'nonExistentId' } as AccountSearchQueryParams
			);
			const expected = new AccountSearchListResponse([], 0, 0, 0);
			expect(accounts).toStrictEqual<AccountSearchListResponse>(expected);
		});
		it('should return one or more accounts, if search type is username', async () => {
			const accounts = await accountUc.searchAccounts(
				{ userId: mockSuperheroUser.id } as ICurrentUser,
				{ type: AccountSearchType.USERNAME, value: '' } as AccountSearchQueryParams
			);
			expect(accounts.skip).toEqual(0);
			expect(accounts.limit).toEqual(10);
			expect(accounts.total).toBeGreaterThan(1);
			expect(accounts.data.length).toBeGreaterThan(1);
		});
		// Todo how do we test this, or should we test this behavior?
		// Todo should this test go into an integration test?
		xit('should return an empty list, if skip is to large', async () => {
			const accounts = await accountUc.searchAccounts(
				{ userId: mockSuperheroUser.id } as ICurrentUser,
				{ type: AccountSearchType.USERNAME, value: '', skip: 1000 } as AccountSearchQueryParams
			);
			expect(accounts.data).toStrictEqual([]);
		});
		it('should throw, if user has not the right permissions', async () => {
			await expect(
				accountUc.searchAccounts({ userId: mockTeacherUser.id } as ICurrentUser, {} as AccountSearchQueryParams)
			).rejects.toThrow(ForbiddenOperationError);
		});
		it('should throw, if search type is unknown', async () => {
			await expect(
				accountUc.searchAccounts(
					{ userId: mockSuperheroUser.id } as ICurrentUser,
					{ type: '' as AccountSearchType } as AccountSearchQueryParams
				)
			).rejects.toThrow('Invalid search type.');
		});
	});

	describe('findAccountById', () => {
		it('should return an account, if the current user is a superhero', async () => {
			const account = await accountUc.findAccountById(
				{ userId: mockSuperheroUser.id } as ICurrentUser,
				{ id: mockStudentAccount.id } as AccountByIdParams
			);
			expect(account).toStrictEqual(
				expect.objectContaining({
					id: mockStudentAccount.id,
					username: mockStudentAccount.username,
					userId: mockStudentUser.id,
					activated: mockStudentAccount.activated ?? false,
				})
			);
		});
		it('should throw, if the current user is no superhero', async () => {
			await expect(
				accountUc.findAccountById(
					{ userId: mockTeacherUser.id } as ICurrentUser,
					{ id: mockStudentAccount.id } as AccountByIdParams
				)
			).rejects.toThrow(ForbiddenOperationError);
		});
		it('should throw, if no account matches the search term', async () => {
			await expect(
				accountUc.findAccountById({ userId: mockSuperheroUser.id } as ICurrentUser, { id: 'xxx' } as AccountByIdParams)
			).rejects.toThrow(EntityNotFoundError);
		});
	});

	describe('updateAccountById', () => {
		it('should throw if executing user does not exist', async () => {
			const currentUser = { userId: '000000000000000' } as ICurrentUser;
			const params = { id: mockStudentAccount.id } as AccountByIdParams;
			const body = {} as AccountByIdBodyParams;
			await expect(accountUc.updateAccountById(currentUser, params, body)).rejects.toThrow(EntityNotFoundError);
		});
		it('should throw if target account does not exist', async () => {
			const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
			const params = { id: '000000000000000' } as AccountByIdParams;
			const body = {} as AccountByIdBodyParams;
			await expect(accountUc.updateAccountById(currentUser, params, body)).rejects.toThrow(EntityNotFoundError);
		});
		it('should update target account password', async () => {
			const previousPasswordHash = mockStudentAccount.password;
			const currentUser = { userId: mockSuperheroUser.id } as ICurrentUser;
			const params = { id: mockStudentAccount.id } as AccountByIdParams;
			const body = { password: defaultPassword } as AccountByIdBodyParams;
			expect(mockStudentUser.forcePasswordChange).toBeFalsy();
			await accountUc.updateAccountById(currentUser, params, body);
			expect(mockStudentAccount.password).not.toBe(previousPasswordHash);
			expect(mockStudentUser.forcePasswordChange).toBeTruthy();
		});
		it('should update target account username', async () => {
			const newUsername = 'newUsername';
			const currentUser = { userId: mockSuperheroUser.id } as ICurrentUser;
			const params = { id: mockStudentAccount.id } as AccountByIdParams;
			const body = { username: newUsername } as AccountByIdBodyParams;
			expect(mockStudentAccount.username).not.toBe(newUsername);
			await accountUc.updateAccountById(currentUser, params, body);
			expect(mockStudentAccount.username).toBe(newUsername.toLowerCase());
		});
		it('should update target account activation state', async () => {
			const currentUser = { userId: mockSuperheroUser.id } as ICurrentUser;
			const params = { id: mockStudentAccount.id } as AccountByIdParams;
			const body = { activated: false } as AccountByIdBodyParams;
			await accountUc.updateAccountById(currentUser, params, body);
			expect(mockStudentAccount.activated).toBeFalsy();
		});

		it('should throw if account can not be updated', async () => {
			const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
			const params = { id: mockStudentAccount.id } as AccountByIdParams;
			const body = { username: 'fail@to.update' } as AccountByIdBodyParams;
			await expect(accountUc.updateAccountById(currentUser, params, body)).rejects.toThrow(EntityNotFoundError);
		});
		it('should throw if user can not be updated', async () => {
			const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
			const params = { id: mockStudentAccount.id } as AccountByIdParams;
			const body = { username: 'user-fail@to.update' } as AccountByIdBodyParams;
			await expect(accountUc.updateAccountById(currentUser, params, body)).rejects.toThrow(EntityNotFoundError);
		});

		describe('hasPermissionsToUpdateAccount', () => {
			it('admin can edit teacher', async () => {
				const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
				const params = { id: mockTeacherAccount.id } as AccountByIdParams;
				const body = {} as AccountByIdBodyParams;
				await expect(accountUc.updateAccountById(currentUser, params, body)).resolves.not.toThrow();
			});
			it('teacher can edit student', async () => {
				const currentUser = { userId: mockTeacherUser.id } as ICurrentUser;
				const params = { id: mockStudentAccount.id } as AccountByIdParams;
				const body = {} as AccountByIdBodyParams;
				await expect(accountUc.updateAccountById(currentUser, params, body)).resolves.not.toThrow();
			});
			it('admin can edit student', async () => {
				const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
				const params = { id: mockStudentAccount.id } as AccountByIdParams;
				const body = {} as AccountByIdBodyParams;
				await expect(accountUc.updateAccountById(currentUser, params, body)).resolves.not.toThrow();
			});
			it('teacher cannot edit other teacher', async () => {
				const currentUser = { userId: mockTeacherUser.id } as ICurrentUser;
				const params = { id: mockOtherTeacherAccount.id } as AccountByIdParams;
				const body = {} as AccountByIdBodyParams;
				await expect(accountUc.updateAccountById(currentUser, params, body)).rejects.toThrow(ForbiddenOperationError);
			});
			it("other school's admin cannot edit teacher", async () => {
				const currentUser = { userId: mockDifferentSchoolAdminUser.id } as ICurrentUser;
				const params = { id: mockTeacherAccount.id } as AccountByIdParams;
				const body = {} as AccountByIdBodyParams;
				await expect(accountUc.updateAccountById(currentUser, params, body)).rejects.toThrow(ForbiddenOperationError);
			});
			it('superhero can edit admin', async () => {
				const currentUser = { userId: mockSuperheroUser.id } as ICurrentUser;
				const params = { id: mockAdminAccount.id } as AccountByIdParams;
				const body = {} as AccountByIdBodyParams;
				await expect(accountUc.updateAccountById(currentUser, params, body)).resolves.not.toThrow();
			});
			it('undefined user role fails by default', async () => {
				const currentUser = { userId: mockUnknownRoleUser.id } as ICurrentUser;
				const params = { id: mockAccountWithoutRole.id } as AccountByIdParams;
				const body = {} as AccountByIdBodyParams;
				await expect(accountUc.updateAccountById(currentUser, params, body)).rejects.toThrow(ForbiddenOperationError);
			});
			it('user without role cannot be edited', async () => {
				const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
				const params = { id: mockUnknownRoleUserAccount.id } as AccountByIdParams;
				const body = {} as AccountByIdBodyParams;
				await expect(accountUc.updateAccountById(currentUser, params, body)).rejects.toThrow(ForbiddenOperationError);
			});
		});
	});

	describe('deleteAccountById', () => {
		it('should delete an account, if current user is authorized', async () => {
			await expect(
				accountUc.deleteAccountById(
					{ userId: mockSuperheroUser.id } as ICurrentUser,
					{ id: mockStudentAccount.id } as AccountByIdParams
				)
			).resolves.not.toThrow();
		});
		it('should throw, if the current user is no superhero', async () => {
			await expect(
				accountUc.deleteAccountById(
					{ userId: mockAdminUser.id } as ICurrentUser,
					{ id: mockStudentAccount.id } as AccountByIdParams
				)
			).rejects.toThrow(ForbiddenOperationError);
		});
		it('should throw, if no account matches the search term', async () => {
			await expect(
				accountUc.deleteAccountById(
					{ userId: mockSuperheroUser.id } as ICurrentUser,
					{ id: 'xxx' } as AccountByIdParams
				)
			).rejects.toThrow(EntityNotFoundError);
		});
	});
});
