import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AccountService } from '@modules/account/services/account.service';
import { AccountSaveDto } from '@modules/account/services/dto';
import { AccountDto } from '@modules/account/services/dto/account.dto';
import { ICurrentUser } from '@modules/authentication';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationError, EntityNotFoundError, ForbiddenOperationError, ValidationError } from '@shared/common';
import { Account, Role, SchoolEntity, SchoolRolePermission, SchoolRoles, User } from '@shared/domain/entity';
import { Permission, RoleName } from '@shared/domain/interface';
import { PermissionService } from '@shared/domain/service';
import { Counted, EntityId } from '@shared/domain/types';
import { UserRepo } from '@shared/repo';
import { accountFactory, schoolEntityFactory, setupEntities, systemEntityFactory, userFactory } from '@shared/testing';
import { BruteForcePrevention } from '@src/imports-from-feathers';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	AccountByIdBodyParams,
	AccountByIdParams,
	AccountSearchListResponse,
	AccountSearchQueryParams,
	AccountSearchType,
} from '../controller/dto';
import { AccountEntityToDtoMapper, AccountResponseMapper } from '../mapper';
import { AccountValidationService } from '../services/account.validation.service';
import { AccountUc } from './account.uc';

describe('AccountUc', () => {
	let module: TestingModule;
	let accountUc: AccountUc;
	let userRepo: UserRepo;
	let accountService: AccountService;
	let accountValidationService: AccountValidationService;
	let configService: DeepMocked<ConfigService>;

	let mockSchool: SchoolEntity;
	let mockOtherSchool: SchoolEntity;
	let mockSchoolWithStudentVisibility: SchoolEntity;

	let mockSuperheroUser: User;
	let mockAdminUser: User;
	let mockTeacherUser: User;
	let mockOtherTeacherUser: User;
	let mockTeacherNoUserNoSchoolPermissionUser: User;
	let mockTeacherNoUserPermissionUser: User;
	let mockStudentSchoolPermissionUser: User;
	let mockStudentUser: User;
	let mockOtherStudentUser: User;
	let mockDifferentSchoolAdminUser: User;
	let mockDifferentSchoolTeacherUser: User;
	let mockDifferentSchoolStudentUser: User;
	let mockUnknownRoleUser: User;
	let mockExternalUser: User;
	let mockUserWithoutAccount: User;
	let mockUserWithoutRole: User;
	let mockStudentUserWithoutAccount: User;
	let mockOtherStudentSchoolPermissionUser: User;

	let mockSuperheroAccount: Account;
	let mockTeacherAccount: Account;
	let mockOtherTeacherAccount: Account;
	let mockTeacherNoUserPermissionAccount: Account;
	let mockTeacherNoUserNoSchoolPermissionAccount: Account;
	let mockAdminAccount: Account;
	let mockStudentAccount: Account;
	let mockStudentSchoolPermissionAccount: Account;
	let mockDifferentSchoolAdminAccount: Account;
	let mockDifferentSchoolTeacherAccount: Account;
	let mockDifferentSchoolStudentAccount: Account;
	let mockUnknownRoleUserAccount: Account;
	let mockExternalUserAccount: Account;
	let mockAccountWithoutRole: Account;
	let mockAccountWithoutUser: Account;
	let mockAccountWithSystemId: Account;
	let mockAccountWithLastFailedLogin: Account;
	let mockAccountWithOldLastFailedLogin: Account;
	let mockAccountWithNoLastFailedLogin: Account;
	let mockAccounts: Account[];
	let mockUsers: User[];

	const defaultPassword = 'DummyPasswd!1';
	const otherPassword = 'DummyPasswd!2';
	const defaultPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';
	const LOGIN_BLOCK_TIME = 15;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AccountUc,
				{
					provide: AccountService,
					useValue: {
						saveWithValidation: jest.fn().mockImplementation((account: AccountDto): Promise<void> => {
							if (account.username === 'fail@to.update') {
								return Promise.reject();
							}
							const accountEntity = mockAccounts.find(
								(tempAccount) => tempAccount.userId?.toString() === account.userId
							);
							if (accountEntity) {
								Object.assign(accountEntity, account);
								return Promise.resolve();
							}
							return Promise.reject();
						}),
						save: jest.fn().mockImplementation((account: AccountDto): Promise<void> => {
							if (account.username === 'fail@to.update') {
								return Promise.reject();
							}
							const accountEntity = mockAccounts.find(
								(tempAccount) => tempAccount.userId?.toString() === account.userId
							);
							if (accountEntity) {
								Object.assign(accountEntity, account);
								return Promise.resolve();
							}
							return Promise.reject();
						}),
						delete: (id: EntityId): Promise<AccountDto> => {
							const account = mockAccounts.find((tempAccount) => tempAccount.id?.toString() === id);

							if (account) {
								return Promise.resolve(AccountEntityToDtoMapper.mapToDto(account));
							}
							throw new EntityNotFoundError(Account.name);
						},
						create: (): Promise<void> => Promise.resolve(),
						findByUserId: (userId: EntityId): Promise<AccountDto | null> => {
							const account = mockAccounts.find((tempAccount) => tempAccount.userId?.toString() === userId);

							if (account) {
								return Promise.resolve(AccountEntityToDtoMapper.mapToDto(account));
							}
							return Promise.resolve(null);
						},
						findByUserIdOrFail: (userId: EntityId): Promise<AccountDto> => {
							const account = mockAccounts.find((tempAccount) => tempAccount.userId?.toString() === userId);

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
						findByUsernameAndSystemId: (username: string, systemId: EntityId | ObjectId): Promise<AccountDto> => {
							const account = mockAccounts.find(
								(tempAccount) => tempAccount.username === username && tempAccount.systemId === systemId
							);
							if (account) {
								return Promise.resolve(AccountEntityToDtoMapper.mapToDto(account));
							}
							throw new EntityNotFoundError(Account.name);
						},
						searchByUsernameExactMatch: (username: string): Promise<Counted<AccountDto[]>> => {
							const account = mockAccounts.find((tempAccount) => tempAccount.username === username);

							if (account) {
								return Promise.resolve([[AccountEntityToDtoMapper.mapToDto(account)], 1]);
							}
							if (username === 'not@available.username') {
								return Promise.resolve([[AccountEntityToDtoMapper.mapToDto(mockOtherTeacherAccount)], 1]);
							}
							if (username === 'multiple@account.username') {
								return Promise.resolve([
									mockAccounts.map((mockAccount) => AccountEntityToDtoMapper.mapToDto(mockAccount)),
									mockAccounts.length,
								]);
							}
							return Promise.resolve([[], 0]);
						},
						searchByUsernamePartialMatch: (): Promise<Counted<AccountDto[]>> =>
							Promise.resolve([
								mockAccounts.map((mockAccount) => AccountEntityToDtoMapper.mapToDto(mockAccount)),
								mockAccounts.length,
							]),
						updateLastTriedFailedLogin: jest.fn(),
						validatePassword: jest.fn().mockResolvedValue(true),
					},
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
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
				{
					provide: AccountValidationService,
					useValue: {
						isUniqueEmail: jest.fn().mockResolvedValue(true),
					},
				},
			],
		}).compile();

		accountUc = module.get(AccountUc);
		userRepo = module.get(UserRepo);
		accountService = module.get(AccountService);
		await setupEntities();
		accountValidationService = module.get(AccountValidationService);
		configService = module.get(ConfigService);
	});

	beforeEach(() => {
		mockSchool = schoolEntityFactory.buildWithId();
		mockOtherSchool = schoolEntityFactory.buildWithId();
		mockSchoolWithStudentVisibility = schoolEntityFactory.buildWithId();
		mockSchoolWithStudentVisibility.permissions = new SchoolRoles();
		mockSchoolWithStudentVisibility.permissions.teacher = new SchoolRolePermission();
		mockSchoolWithStudentVisibility.permissions.teacher.STUDENT_LIST = true;

		mockSuperheroUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [
				new Role({
					name: RoleName.SUPERHERO,
					permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
				}),
			],
		});
		mockAdminUser = userFactory.buildWithId({
			school: mockSchool,
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
		mockTeacherUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [
				new Role({
					name: RoleName.TEACHER,
					permissions: [Permission.STUDENT_EDIT, Permission.STUDENT_LIST, Permission.TEACHER_LIST],
				}),
			],
		});
		mockOtherTeacherUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [
				new Role({
					name: RoleName.TEACHER,
					permissions: [Permission.STUDENT_EDIT, Permission.STUDENT_LIST, Permission.TEACHER_LIST],
				}),
			],
		});
		mockTeacherNoUserPermissionUser = userFactory.buildWithId({
			school: mockSchoolWithStudentVisibility,
			roles: [
				new Role({
					name: RoleName.TEACHER,
					permissions: [],
				}),
			],
		});
		mockTeacherNoUserNoSchoolPermissionUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [
				new Role({
					name: RoleName.TEACHER,
					permissions: [],
				}),
			],
		});
		mockStudentSchoolPermissionUser = userFactory.buildWithId({
			school: mockSchoolWithStudentVisibility,
			roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
		});
		mockOtherStudentSchoolPermissionUser = userFactory.buildWithId({
			school: mockSchoolWithStudentVisibility,
			roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
		});
		mockStudentUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
		});
		mockOtherStudentUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
		});
		mockDifferentSchoolAdminUser = userFactory.buildWithId({
			school: mockOtherSchool,
			roles: [...mockAdminUser.roles],
		});
		mockDifferentSchoolTeacherUser = userFactory.buildWithId({
			school: mockOtherSchool,
			roles: [...mockTeacherUser.roles],
		});
		mockDifferentSchoolStudentUser = userFactory.buildWithId({
			school: mockOtherSchool,
			roles: [...mockStudentUser.roles],
		});
		mockUserWithoutAccount = userFactory.buildWithId({
			school: mockSchool,
			roles: [
				new Role({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
				}),
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
		mockStudentUserWithoutAccount = userFactory.buildWithId({
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
		mockTeacherNoUserPermissionAccount = accountFactory.buildWithId({
			userId: mockTeacherNoUserPermissionUser.id,
			password: defaultPasswordHash,
		});
		mockTeacherNoUserNoSchoolPermissionAccount = accountFactory.buildWithId({
			userId: mockTeacherNoUserNoSchoolPermissionUser.id,
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
		mockStudentSchoolPermissionAccount = accountFactory.buildWithId({
			userId: mockStudentSchoolPermissionUser.id,
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
		mockDifferentSchoolTeacherAccount = accountFactory.buildWithId({
			userId: mockDifferentSchoolTeacherUser.id,
			password: defaultPasswordHash,
		});
		mockDifferentSchoolStudentAccount = accountFactory.buildWithId({
			userId: mockDifferentSchoolStudentUser.id,
			password: defaultPasswordHash,
		});
		mockUnknownRoleUserAccount = accountFactory.buildWithId({
			userId: mockUnknownRoleUser.id,
			password: defaultPasswordHash,
		});
		const externalSystem = systemEntityFactory.buildWithId();
		mockExternalUserAccount = accountFactory.buildWithId({
			userId: mockExternalUser.id,
			password: defaultPasswordHash,
			systemId: externalSystem.id,
		});
		mockAccountWithoutUser = accountFactory.buildWithId({
			userId: undefined,
			password: defaultPasswordHash,
			systemId: systemEntityFactory.buildWithId().id,
		});
		mockAccountWithSystemId = accountFactory.withSystemId(new ObjectId(10)).build();
		mockAccountWithLastFailedLogin = accountFactory.buildWithId({
			userId: undefined,
			password: defaultPasswordHash,
			systemId: systemEntityFactory.buildWithId().id,
			lasttriedFailedLogin: new Date(),
		});
		mockAccountWithOldLastFailedLogin = accountFactory.buildWithId({
			userId: undefined,
			password: defaultPasswordHash,
			systemId: systemEntityFactory.buildWithId().id,
			lasttriedFailedLogin: new Date(new Date().getTime() - LOGIN_BLOCK_TIME - 1),
		});
		mockAccountWithNoLastFailedLogin = accountFactory.buildWithId({
			userId: undefined,
			password: defaultPasswordHash,
			systemId: systemEntityFactory.buildWithId().id,
			lasttriedFailedLogin: undefined,
		});

		mockUsers = [
			mockSuperheroUser,
			mockAdminUser,
			mockTeacherUser,
			mockOtherTeacherUser,
			mockTeacherNoUserPermissionUser,
			mockTeacherNoUserNoSchoolPermissionUser,
			mockStudentUser,
			mockStudentSchoolPermissionUser,
			mockDifferentSchoolAdminUser,
			mockDifferentSchoolTeacherUser,
			mockDifferentSchoolStudentUser,
			mockUnknownRoleUser,
			mockExternalUser,
			mockUserWithoutRole,
			mockUserWithoutAccount,
			mockStudentUserWithoutAccount,
			mockOtherStudentUser,
			mockOtherStudentSchoolPermissionUser,
		];

		mockAccounts = [
			mockSuperheroAccount,
			mockAdminAccount,
			mockTeacherAccount,
			mockOtherTeacherAccount,
			mockTeacherNoUserPermissionAccount,
			mockTeacherNoUserNoSchoolPermissionAccount,
			mockStudentAccount,
			mockStudentSchoolPermissionAccount,
			mockDifferentSchoolAdminAccount,
			mockDifferentSchoolTeacherAccount,
			mockDifferentSchoolStudentAccount,
			mockUnknownRoleUserAccount,
			mockExternalUserAccount,
			mockAccountWithoutRole,
			mockAccountWithoutUser,
			mockAccountWithSystemId,
			mockAccountWithLastFailedLogin,
			mockAccountWithOldLastFailedLogin,
			mockAccountWithNoLastFailedLogin,
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
				accountUc.updateMyAccount(mockExternalUserAccount.userId?.toString() ?? '', {
					passwordOld: defaultPassword,
				})
			).rejects.toThrow(ForbiddenOperationError);
		});
		it('should throw if password does not match', async () => {
			jest.spyOn(accountService, 'validatePassword').mockResolvedValueOnce(false);
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
			const accountIsUniqueEmailSpy = jest.spyOn(accountValidationService, 'isUniqueEmail');
			accountIsUniqueEmailSpy.mockResolvedValueOnce(false);
			await expect(
				accountUc.updateMyAccount(mockStudentUser.id, {
					passwordOld: defaultPassword,
					email: mockAdminUser.email,
				})
			).rejects.toThrow(ValidationError);
		});
		it('should allow to update with strong password', async () => {
			await expect(
				accountUc.updateMyAccount(mockStudentUser.id, {
					passwordOld: defaultPassword,
					passwordNew: otherPassword,
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
		it('should not update password if no new password', async () => {
			const spy = jest.spyOn(accountService, 'save');
			await accountUc.updateMyAccount(mockStudentUser.id, {
				passwordOld: defaultPassword,
				passwordNew: undefined,
				email: 'newemail@to.update',
			});
			expect(spy).toHaveBeenCalledWith(
				expect.objectContaining({
					password: undefined,
				})
			);
		});
	});

	describe('replaceMyTemporaryPassword', () => {
		it('should throw if passwords do not match', async () => {
			await expect(
				accountUc.replaceMyTemporaryPassword(
					mockStudentAccount.userId?.toString() ?? '',
					defaultPassword,
					'FooPasswd!1'
				)
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
				accountUc.replaceMyTemporaryPassword(
					mockExternalUserAccount.userId?.toString() ?? '',
					defaultPassword,
					defaultPassword
				)
			).rejects.toThrow(ForbiddenOperationError);
		});
		it('should throw if not the users password is temporary', async () => {
			mockStudentUser.forcePasswordChange = false;
			mockStudentUser.preferences = { firstLogin: true };
			await expect(
				accountUc.replaceMyTemporaryPassword(
					mockStudentAccount.userId?.toString() ?? '',
					defaultPassword,
					defaultPassword
				)
			).rejects.toThrow(ForbiddenOperationError);
		});
		it('should throw, if old password is the same as new password', async () => {
			mockStudentUser.forcePasswordChange = false;
			mockStudentUser.preferences = { firstLogin: false };
			await expect(
				accountUc.replaceMyTemporaryPassword(
					mockStudentAccount.userId?.toString() ?? '',
					defaultPassword,
					defaultPassword
				)
			).rejects.toThrow(ForbiddenOperationError);
		});
		it('should throw, if old password is undefined', async () => {
			mockStudentUser.forcePasswordChange = false;
			mockStudentUser.preferences = { firstLogin: false };
			mockStudentAccount.password = undefined;
			await expect(
				accountUc.replaceMyTemporaryPassword(
					mockStudentAccount.userId?.toString() ?? '',
					defaultPassword,
					defaultPassword
				)
			).rejects.toThrow(Error);
		});
		it('should allow to set strong password, if the admin manipulated the users password', async () => {
			mockStudentUser.forcePasswordChange = true;
			mockStudentUser.preferences = { firstLogin: true };
			jest.spyOn(accountService, 'validatePassword').mockResolvedValueOnce(false);
			await expect(
				accountUc.replaceMyTemporaryPassword(mockStudentAccount.userId?.toString() ?? '', otherPassword, otherPassword)
			).resolves.not.toThrow();
		});
		it('should allow to set strong password, if this is the users first login', async () => {
			mockStudentUser.forcePasswordChange = false;
			mockStudentUser.preferences = { firstLogin: false };
			jest.spyOn(accountService, 'validatePassword').mockResolvedValueOnce(false);
			await expect(
				accountUc.replaceMyTemporaryPassword(mockStudentAccount.userId?.toString() ?? '', otherPassword, otherPassword)
			).resolves.not.toThrow();
		});
		it('should allow to set strong password, if this is the users first login (if undefined)', async () => {
			mockStudentUser.forcePasswordChange = false;
			mockStudentUser.preferences = undefined;
			jest.spyOn(accountService, 'validatePassword').mockResolvedValueOnce(false);
			await expect(
				accountUc.replaceMyTemporaryPassword(mockStudentAccount.userId?.toString() ?? '', otherPassword, otherPassword)
			).resolves.not.toThrow();
		});
		it('should throw if user can not be updated', async () => {
			mockStudentUser.forcePasswordChange = false;
			mockStudentUser.preferences = { firstLogin: false };
			mockStudentUser.firstName = 'failToUpdate';
			jest.spyOn(accountService, 'validatePassword').mockResolvedValueOnce(false);
			await expect(
				accountUc.replaceMyTemporaryPassword(mockStudentAccount.userId?.toString() ?? '', otherPassword, otherPassword)
			).rejects.toThrow(EntityNotFoundError);
		});
		it('should throw if account can not be updated', async () => {
			mockStudentUser.forcePasswordChange = false;
			mockStudentUser.preferences = { firstLogin: false };
			mockStudentAccount.username = 'fail@to.update';
			jest.spyOn(accountService, 'validatePassword').mockResolvedValueOnce(false);
			await expect(
				accountUc.replaceMyTemporaryPassword(mockStudentAccount.userId?.toString() ?? '', otherPassword, otherPassword)
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
				{ type: AccountSearchType.USER_ID, value: mockUserWithoutAccount.id } as AccountSearchQueryParams
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
		it('should throw, if user has not the right permissions', async () => {
			await expect(
				accountUc.searchAccounts(
					{ userId: mockTeacherUser.id } as ICurrentUser,
					{ type: AccountSearchType.USER_ID, value: mockAdminUser.id } as AccountSearchQueryParams
				)
			).rejects.toThrow(ForbiddenOperationError);

			await expect(
				accountUc.searchAccounts(
					{ userId: mockStudentUser.id } as ICurrentUser,
					{ type: AccountSearchType.USER_ID, value: mockOtherStudentUser.id } as AccountSearchQueryParams
				)
			).rejects.toThrow(ForbiddenOperationError);

			await expect(
				accountUc.searchAccounts(
					{ userId: mockStudentUser.id } as ICurrentUser,
					{ type: AccountSearchType.USER_ID, value: mockTeacherUser.id } as AccountSearchQueryParams
				)
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
		it('should throw, if user is no superhero', async () => {
			await expect(
				accountUc.searchAccounts(
					{ userId: mockTeacherUser.id } as ICurrentUser,
					{ type: AccountSearchType.USERNAME, value: mockStudentUser.id } as AccountSearchQueryParams
				)
			).rejects.toThrow(ForbiddenOperationError);
		});

		describe('hasPermissionsToAccessAccount', () => {
			beforeEach(() => {
				configService.get.mockReturnValue(false);
			});
			it('admin can access teacher of the same school via user id', async () => {
				const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
				const params = { type: AccountSearchType.USER_ID, value: mockTeacherUser.id } as AccountSearchQueryParams;
				await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();
			});
			it('admin can access student of the same school via user id', async () => {
				const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
				const params = { type: AccountSearchType.USER_ID, value: mockStudentUser.id } as AccountSearchQueryParams;
				await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();
			});
			it('admin can not access admin of the same school via user id', async () => {
				const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
				const params = { type: AccountSearchType.USER_ID, value: mockAdminUser.id } as AccountSearchQueryParams;
				await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();
			});
			it('admin can not access any account of a foreign school via user id', async () => {
				const currentUser = { userId: mockDifferentSchoolAdminUser.id } as ICurrentUser;

				let params = { type: AccountSearchType.USER_ID, value: mockTeacherUser.id } as AccountSearchQueryParams;
				await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();

				params = { type: AccountSearchType.USER_ID, value: mockStudentUser.id } as AccountSearchQueryParams;
				await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();
			});
			it('teacher can access teacher of the same school via user id', async () => {
				const currentUser = { userId: mockTeacherUser.id } as ICurrentUser;
				const params = { type: AccountSearchType.USER_ID, value: mockOtherTeacherUser.id } as AccountSearchQueryParams;
				await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();
			});
			it('teacher can access student of the same school via user id', async () => {
				const currentUser = { userId: mockTeacherUser.id } as ICurrentUser;
				const params = { type: AccountSearchType.USER_ID, value: mockStudentUser.id } as AccountSearchQueryParams;
				await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();
			});
			it('teacher can not access admin of the same school via user id', async () => {
				const currentUser = { userId: mockTeacherUser.id } as ICurrentUser;
				const params = { type: AccountSearchType.USER_ID, value: mockAdminUser.id } as AccountSearchQueryParams;
				await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();
			});
			it('teacher can not access any account of a foreign school via user id', async () => {
				const currentUser = { userId: mockDifferentSchoolTeacherUser.id } as ICurrentUser;

				let params = { type: AccountSearchType.USER_ID, value: mockTeacherUser.id } as AccountSearchQueryParams;
				await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();

				params = { type: AccountSearchType.USER_ID, value: mockStudentUser.id } as AccountSearchQueryParams;
				await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();
			});
			it('teacher can access student of the same school via user id if school has global permission', async () => {
				configService.get.mockReturnValue(true);
				const currentUser = { userId: mockTeacherNoUserPermissionUser.id } as ICurrentUser;
				const params = {
					type: AccountSearchType.USER_ID,
					value: mockStudentSchoolPermissionUser.id,
				} as AccountSearchQueryParams;
				await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();
			});
			it('teacher can not access student of the same school if school has no global permission', async () => {
				configService.get.mockReturnValue(true);
				const currentUser = { userId: mockTeacherNoUserNoSchoolPermissionUser.id } as ICurrentUser;
				const params = { type: AccountSearchType.USER_ID, value: mockStudentUser.id } as AccountSearchQueryParams;
				await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow(ForbiddenOperationError);
			});

			it('student can not access student of the same school if school has global permission', async () => {
				configService.get.mockReturnValue(true);
				const currentUser = { userId: mockStudentSchoolPermissionUser.id } as ICurrentUser;
				const params = {
					type: AccountSearchType.USER_ID,
					value: mockOtherStudentSchoolPermissionUser.id,
				} as AccountSearchQueryParams;
				await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow(ForbiddenOperationError);
			});
			it('student can not access any other account via user id', async () => {
				const currentUser = { userId: mockStudentUser.id } as ICurrentUser;

				let params = { type: AccountSearchType.USER_ID, value: mockAdminUser.id } as AccountSearchQueryParams;
				await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();

				params = { type: AccountSearchType.USER_ID, value: mockTeacherUser.id } as AccountSearchQueryParams;
				await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();

				params = { type: AccountSearchType.USER_ID, value: mockStudentUser.id } as AccountSearchQueryParams;
				await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();
			});
			it('superhero can access any account via username', async () => {
				const currentUser = { userId: mockSuperheroUser.id } as ICurrentUser;

				let params = { type: AccountSearchType.USERNAME, value: mockAdminAccount.username } as AccountSearchQueryParams;
				await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();

				params = { type: AccountSearchType.USERNAME, value: mockTeacherAccount.username } as AccountSearchQueryParams;
				await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();

				params = { type: AccountSearchType.USERNAME, value: mockStudentAccount.username } as AccountSearchQueryParams;
				await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();

				params = {
					type: AccountSearchType.USERNAME,
					value: mockDifferentSchoolAdminAccount.username,
				} as AccountSearchQueryParams;
				await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();

				params = {
					type: AccountSearchType.USERNAME,
					value: mockDifferentSchoolTeacherAccount.username,
				} as AccountSearchQueryParams;
				await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();

				params = {
					type: AccountSearchType.USERNAME,
					value: mockDifferentSchoolStudentAccount.username,
				} as AccountSearchQueryParams;
				await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();
			});
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
					activated: mockStudentAccount.activated,
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
		it('should throw, if target account has no user', async () => {
			await expect(
				accountUc.findAccountById({ userId: mockSuperheroUser.id } as ICurrentUser, { id: 'xxx' } as AccountByIdParams)
			).rejects.toThrow(EntityNotFoundError);
		});
	});

	describe('saveAccount', () => {
		afterEach(() => {
			jest.clearAllMocks();
		});

		it('should call account service', async () => {
			const spy = jest.spyOn(accountService, 'saveWithValidation');
			const params: AccountSaveDto = {
				username: 'john.doe@domain.tld',
				password: defaultPassword,
			};
			await accountUc.saveAccount(params);
			expect(spy).toHaveBeenCalledWith(
				expect.objectContaining({
					username: 'john.doe@domain.tld',
				})
			);
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
		it('should throw if target account has no user', async () => {
			await expect(
				accountUc.updateAccountById(
					{ userId: mockSuperheroUser.id } as ICurrentUser,
					{ id: mockAccountWithoutUser.id } as AccountByIdParams,
					{ username: 'user-fail@to.update' } as AccountByIdBodyParams
				)
			).rejects.toThrow(EntityNotFoundError);
		});
		it('should throw if new username already in use', async () => {
			const accountIsUniqueEmailSpy = jest.spyOn(accountValidationService, 'isUniqueEmail');
			accountIsUniqueEmailSpy.mockResolvedValueOnce(false);
			const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
			const params = { id: mockStudentAccount.id } as AccountByIdParams;
			const body = { username: mockOtherTeacherAccount.username } as AccountByIdBodyParams;
			await expect(accountUc.updateAccountById(currentUser, params, body)).rejects.toThrow(ValidationError);
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

	describe('checkBrutForce', () => {
		let updateMock: jest.Mock;
		beforeAll(() => {
			configService.get.mockReturnValue(LOGIN_BLOCK_TIME);
		});
		afterAll(() => {
			configService.get.mockRestore();
		});
		beforeEach(() => {
			// eslint-disable-next-line jest/unbound-method
			updateMock = accountService.updateLastTriedFailedLogin as jest.Mock;
			updateMock.mockClear();
		});
		it('should throw, if time difference < the allowed time', async () => {
			await expect(
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				accountUc.checkBrutForce(mockAccountWithLastFailedLogin.username, mockAccountWithLastFailedLogin.systemId!)
			).rejects.toThrow(BruteForcePrevention);
		});
		it('should not throw Error, if the time difference > the allowed time', async () => {
			await expect(
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				accountUc.checkBrutForce(mockAccountWithSystemId.username, mockAccountWithSystemId.systemId!)
			).resolves.not.toThrow();
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			expect(updateMock.mock.calls[0][0]).toEqual(mockAccountWithSystemId.id);
			const newDate = new Date().getTime() - 10000;
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			expect((updateMock.mock.calls[0][1] as Date).getTime()).toBeGreaterThan(newDate);
		});
		it('should not throw, if lasttriedFailedLogin is undefined', async () => {
			await expect(
				accountUc.checkBrutForce(
					mockAccountWithNoLastFailedLogin.username,
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					mockAccountWithNoLastFailedLogin.systemId!
				)
			).resolves.not.toThrow();
		});
	});
});
