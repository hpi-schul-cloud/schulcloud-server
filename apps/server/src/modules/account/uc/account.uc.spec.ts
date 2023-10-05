import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationError, EntityNotFoundError, ForbiddenOperationError, ValidationError } from '@shared/common';
import {
	Account,
	EntityId,
	Permission,
	PermissionService,
	Role,
	RoleName,
	SchoolRolePermission,
	SchoolRoles,
	User,
} from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { accountFactory, schoolFactory, setupEntities, systemFactory, userFactory } from '@shared/testing';
import { BruteForcePrevention } from '@src/imports-from-feathers';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountSaveDto } from '@src/modules/account/services/dto';
import { AccountDto } from '@src/modules/account/services/dto/account.dto';
import { ICurrentUser } from '@src/modules/authentication';
import { ObjectId } from 'bson';
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
	let userRepo: DeepMocked<UserRepo>;
	let accountService: DeepMocked<AccountService>;
	let accountValidationService: DeepMocked<AccountValidationService>;
	let configService: DeepMocked<ConfigService>;

	const defaultPassword = 'DummyPasswd!1';
	const otherPassword = 'DummyPasswd!2';
	const defaultPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';
	const LOGIN_BLOCK_TIME = 15;

	afterAll(async () => {
		jest.restoreAllMocks();
		jest.resetAllMocks();
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AccountUc,
				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				PermissionService,
				{
					provide: AccountValidationService,
					useValue: createMock<AccountValidationService>(),
				},
			],
		}).compile();

		accountUc = module.get(AccountUc);
		userRepo = module.get(UserRepo);
		accountService = module.get(AccountService);
		accountValidationService = module.get(AccountValidationService);
		configService = module.get(ConfigService);
		await setupEntities();
	});

	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetAllMocks();
	});

	describe('updateMyAccount', () => {
		describe('When user does not exist', () => {
			const setup = () => {
				userRepo.findById.mockImplementation(() => {
					throw new EntityNotFoundError(User.name);
				});
			};

			it('should throw EntityNotFoundError', async () => {
				setup();
				await expect(accountUc.updateMyAccount('accountWithoutUser', { passwordOld: defaultPassword })).rejects.toThrow(
					EntityNotFoundError
				);
			});
		});

		describe('When account does not exists', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockUserWithoutAccount = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.ADMINISTRATOR,
							permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
						}),
					],
				});

				accountService.findByUserIdOrFail.mockImplementation((): Promise<AccountDto> => {
					throw new EntityNotFoundError(Account.name);
				});

				return { mockUserWithoutAccount };
			};

			it('should throw entity not found error', async () => {
				const { mockUserWithoutAccount } = setup();
				await expect(
					accountUc.updateMyAccount(mockUserWithoutAccount.id, {
						passwordOld: defaultPassword,
					})
				).rejects.toThrow(EntityNotFoundError);
			});
		});
		describe('When account is external', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockExternalUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const externalSystem = systemFactory.buildWithId();
				const mockExternalUserAccount = accountFactory.buildWithId({
					userId: mockExternalUser.id,
					password: defaultPasswordHash,
					systemId: externalSystem.id,
				});

				accountService.findByUserIdOrFail.mockResolvedValueOnce(
					AccountEntityToDtoMapper.mapToDto(mockExternalUserAccount)
				);

				return { mockExternalUserAccount };
			};
			it('should throw ForbiddenOperationError', async () => {
				const { mockExternalUserAccount } = setup();

				await expect(
					accountUc.updateMyAccount(mockExternalUserAccount.userId?.toString() ?? '', {
						passwordOld: defaultPassword,
					})
				).rejects.toThrow(ForbiddenOperationError);
			});
		});

		describe('When password does not match', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValueOnce(mockStudentUser);
				accountService.findByUserIdOrFail.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));
				accountService.validatePassword.mockResolvedValueOnce(false);

				return { mockStudentUser };
			};
			it('should throw AuthorizationError', async () => {
				const { mockStudentUser } = setup();
				await expect(
					accountUc.updateMyAccount(mockStudentUser.id, {
						passwordOld: 'DoesNotMatch',
					})
				).rejects.toThrow(AuthorizationError);
			});
		});

		describe('When changing own name is not allowed', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValue(mockStudentUser);
				accountService.findByUserIdOrFail.mockResolvedValue(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));
				accountService.validatePassword.mockResolvedValue(true);

				return { mockStudentUser };
			};
			it('should throw ForbiddenOperationError', async () => {
				const { mockStudentUser } = setup();
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
		});

		describe('When using student user', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValue(mockStudentUser);
				accountService.findByUserIdOrFail.mockResolvedValue(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));
				accountService.validatePassword.mockResolvedValue(true);

				return { mockStudentUser };
			};
			it('should allow to update email', async () => {
				const { mockStudentUser } = setup();
				await expect(
					accountUc.updateMyAccount(mockStudentUser.id, {
						passwordOld: defaultPassword,
						email: 'an@available.mail',
					})
				).resolves.not.toThrow();
			});
		});
		describe('When using student user', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValue(mockStudentUser);
				accountService.findByUserIdOrFail.mockResolvedValue(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));
				accountService.validatePassword.mockResolvedValue(true);
				accountValidationService.isUniqueEmail.mockResolvedValueOnce(true);
				const accountSaveSpy = jest.spyOn(accountService, 'save');

				return { mockStudentUser, accountSaveSpy };
			};
			it('should use email as account user name in lower case', async () => {
				const { mockStudentUser, accountSaveSpy } = setup();

				const testMail = 'AN@AVAILABLE.MAIL';
				await expect(
					accountUc.updateMyAccount(mockStudentUser.id, {
						passwordOld: defaultPassword,
						email: testMail,
					})
				).resolves.not.toThrow();
				expect(accountSaveSpy).toBeCalledWith(expect.objectContaining({ username: testMail.toLowerCase() }));
			});
		});

		describe('When using student user', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValue(mockStudentUser);
				accountService.findByUserIdOrFail.mockResolvedValue(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));
				accountService.validatePassword.mockResolvedValue(true);
				accountValidationService.isUniqueEmail.mockResolvedValueOnce(true);

				const userUpdateSpy = jest.spyOn(userRepo, 'save');

				return { mockStudentUser, userUpdateSpy };
			};
			it('should use email as user email in lower case', async () => {
				const { mockStudentUser, userUpdateSpy } = setup();
				const testMail = 'AN@AVAILABLE.MAIL';
				await expect(
					accountUc.updateMyAccount(mockStudentUser.id, {
						passwordOld: defaultPassword,
						email: testMail,
					})
				).resolves.not.toThrow();
				expect(userUpdateSpy).toBeCalledWith(expect.objectContaining({ email: testMail.toLowerCase() }));
			});
		});
		describe('When using student user', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValue(mockStudentUser);
				accountService.findByUserIdOrFail.mockResolvedValue(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));
				accountService.validatePassword.mockResolvedValue(true);
				accountValidationService.isUniqueEmail.mockResolvedValueOnce(true);

				const accountSaveSpy = jest.spyOn(accountService, 'save');
				const userUpdateSpy = jest.spyOn(userRepo, 'save');

				return { mockStudentUser, accountSaveSpy, userUpdateSpy };
			};
			it('should always update account user name AND user email together.', async () => {
				const { mockStudentUser, accountSaveSpy, userUpdateSpy } = setup();
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
		});

		describe('When using student user', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValue(mockStudentUser);
				accountService.findByUserIdOrFail.mockResolvedValue(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));
				accountService.validatePassword.mockResolvedValue(true);
				accountValidationService.isUniqueEmail.mockResolvedValueOnce(false);

				return { mockStudentUser };
			};
			it('should throw if new email already in use', async () => {
				const { mockStudentUser } = setup();
				await expect(
					accountUc.updateMyAccount(mockStudentUser.id, {
						passwordOld: defaultPassword,
						email: 'already@in.use',
					})
				).rejects.toThrow(ValidationError);
			});
		});

		describe('When using student user', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValue(mockStudentUser);
				accountService.findByUserIdOrFail.mockResolvedValue(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));
				accountService.validatePassword.mockResolvedValue(true);

				return { mockStudentUser };
			};
			it('should allow to update with strong password', async () => {
				const { mockStudentUser } = setup();
				await expect(
					accountUc.updateMyAccount(mockStudentUser.id, {
						passwordOld: defaultPassword,
						passwordNew: otherPassword,
					})
				).resolves.not.toThrow();
			});
		});

		describe('When using teacher user', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockTeacherUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.TEACHER,
							permissions: [Permission.STUDENT_EDIT, Permission.STUDENT_LIST, Permission.TEACHER_LIST],
						}),
					],
				});

				const mockTeacherAccount = accountFactory.buildWithId({
					userId: mockTeacherUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValue(mockTeacherUser);
				accountService.findByUserIdOrFail.mockResolvedValue(AccountEntityToDtoMapper.mapToDto(mockTeacherAccount));
				accountService.validatePassword.mockResolvedValue(true);

				return { mockTeacherUser };
			};
			it('should allow to update first and last name', async () => {
				const { mockTeacherUser } = setup();
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
		});

		describe('When using admin user', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockAdminUser = userFactory.buildWithId({
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

				const mockAdminAccount = accountFactory.buildWithId({
					userId: mockAdminUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValue(mockAdminUser);
				accountService.findByUserIdOrFail.mockResolvedValue(AccountEntityToDtoMapper.mapToDto(mockAdminAccount));
				accountService.validatePassword.mockResolvedValue(true);

				return { mockAdminUser };
			};
			it('should allow to update first and last name', async () => {
				const { mockAdminUser } = setup();
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
		});

		describe('When using superhero user', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockSuperheroUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.SUPERHERO,
							permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
						}),
					],
				});
				const mockSuperheroAccount = accountFactory.buildWithId({
					userId: mockSuperheroUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValue(mockSuperheroUser);
				accountService.findByUserIdOrFail.mockResolvedValue(AccountEntityToDtoMapper.mapToDto(mockSuperheroAccount));
				accountService.validatePassword.mockResolvedValue(true);

				return { mockSuperheroUser };
			};
			it('should allow to update first and last name ', async () => {
				const { mockSuperheroUser } = setup();
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
		});

		describe('When user can not be updated', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockTeacherUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.TEACHER,
							permissions: [Permission.STUDENT_EDIT, Permission.STUDENT_LIST, Permission.TEACHER_LIST],
						}),
					],
				});
				const mockTeacherAccount = accountFactory.buildWithId({
					userId: mockTeacherUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValue(mockTeacherUser);
				userRepo.save.mockRejectedValueOnce(undefined);
				accountService.findByUserIdOrFail.mockResolvedValue(AccountEntityToDtoMapper.mapToDto(mockTeacherAccount));
				accountService.validatePassword.mockResolvedValue(true);

				return { mockTeacherUser, mockTeacherAccount };
			};
			it('should throw EntityNotFoundError', async () => {
				const { mockTeacherUser } = setup();
				await expect(
					accountUc.updateMyAccount(mockTeacherUser.id, {
						passwordOld: defaultPassword,
						firstName: 'failToUpdate',
					})
				).rejects.toThrow(EntityNotFoundError);
			});
		});

		describe('When account can not be updated', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValue(mockStudentUser);
				userRepo.save.mockResolvedValueOnce(undefined);
				accountService.findByUserIdOrFail.mockResolvedValue(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));
				accountService.validatePassword.mockResolvedValue(true);
				accountService.save.mockRejectedValueOnce(undefined);

				accountValidationService.isUniqueEmail.mockResolvedValue(true);

				return { mockStudentUser };
			};
			it('should throw EntityNotFoundError', async () => {
				const { mockStudentUser } = setup();
				await expect(
					accountUc.updateMyAccount(mockStudentUser.id, {
						passwordOld: defaultPassword,
						email: 'fail@to.update',
					})
				).rejects.toThrow(EntityNotFoundError);
			});
		});

		describe('When no new password is given', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});

				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValue(mockStudentUser);
				accountService.findByUserIdOrFail.mockResolvedValue(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));
				accountService.validatePassword.mockResolvedValue(true);
				const spyAccountServiceSave = jest.spyOn(accountService, 'save');

				accountValidationService.isUniqueEmail.mockResolvedValue(true);

				return { mockStudentUser, spyAccountServiceSave };
			};
			it('should not update password', async () => {
				const { mockStudentUser, spyAccountServiceSave } = setup();
				await accountUc.updateMyAccount(mockStudentUser.id, {
					passwordOld: defaultPassword,
					passwordNew: undefined,
					email: 'newemail@to.update',
				});
				expect(spyAccountServiceSave).toHaveBeenCalledWith(
					expect.objectContaining({
						password: undefined,
					})
				);
			});
		});
	});

	describe('replaceMyTemporaryPassword', () => {
		describe('When passwords do not match', () => {
			it('should throw ForbiddenOperationError', async () => {
				await expect(accountUc.replaceMyTemporaryPassword('userId', defaultPassword, 'FooPasswd!1')).rejects.toThrow(
					ForbiddenOperationError
				);
			});
		});

		describe('When account does not exists', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();
				const mockUserWithoutAccount = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.ADMINISTRATOR,
							permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
						}),
					],
				});

				userRepo.findById.mockResolvedValueOnce(mockUserWithoutAccount);
				accountService.findByUserIdOrFail.mockImplementation(() => {
					throw new EntityNotFoundError(Account.name);
				});

				return { mockUserWithoutAccount };
			};
			it('should throw EntityNotFoundError', async () => {
				const { mockUserWithoutAccount } = setup();
				await expect(
					accountUc.replaceMyTemporaryPassword(mockUserWithoutAccount.id, defaultPassword, defaultPassword)
				).rejects.toThrow(EntityNotFoundError);
			});
		});

		describe('When user does not exist', () => {
			const setup = () => {
				userRepo.findById.mockRejectedValueOnce(undefined);
			};
			it('should throw EntityNotFoundError', async () => {
				setup();
				await expect(
					accountUc.replaceMyTemporaryPassword('accountWithoutUser', defaultPassword, defaultPassword)
				).rejects.toThrow(EntityNotFoundError);
			});
		});

		describe('When account is external', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockExternalUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const externalSystem = systemFactory.buildWithId();
				const mockExternalUserAccount = accountFactory.buildWithId({
					userId: mockExternalUser.id,
					password: defaultPasswordHash,
					systemId: externalSystem.id,
				});

				userRepo.findById.mockResolvedValueOnce(mockExternalUser);
				accountService.findByUserIdOrFail.mockResolvedValueOnce(
					AccountEntityToDtoMapper.mapToDto(mockExternalUserAccount)
				);

				return { mockExternalUserAccount };
			};
			it('should throw ForbiddenOperationError', async () => {
				const { mockExternalUserAccount } = setup();
				await expect(
					accountUc.replaceMyTemporaryPassword(
						mockExternalUserAccount.userId?.toString() ?? '',
						defaultPassword,
						defaultPassword
					)
				).rejects.toThrow(ForbiddenOperationError);
			});
		});
		describe('When not the users password is temporary', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
					forcePasswordChange: false,
					preferences: { firstLogin: true },
				});

				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValueOnce(mockStudentUser);
				accountService.findByUserIdOrFail.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));

				return { mockStudentAccount };
			};
			it('should throw ForbiddenOperationError', async () => {
				const { mockStudentAccount } = setup();
				await expect(
					accountUc.replaceMyTemporaryPassword(
						mockStudentAccount.userId?.toString() ?? '',
						defaultPassword,
						defaultPassword
					)
				).rejects.toThrow(ForbiddenOperationError);
			});
		});

		describe('When old password is the same as new password', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
					forcePasswordChange: false,
					preferences: { firstLogin: false },
				});

				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValueOnce(mockStudentUser);
				accountService.findByUserIdOrFail.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));
				accountService.validatePassword.mockResolvedValueOnce(true);

				return { mockStudentAccount };
			};
			it('should throw ForbiddenOperationError', async () => {
				const { mockStudentAccount } = setup();
				await expect(
					accountUc.replaceMyTemporaryPassword(
						mockStudentAccount.userId?.toString() ?? '',
						defaultPassword,
						defaultPassword
					)
				).rejects.toThrow(ForbiddenOperationError);
			});
		});

		describe('When old password is undefined', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
					forcePasswordChange: false,
					preferences: { firstLogin: false },
				});

				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: undefined,
				});

				userRepo.findById.mockResolvedValueOnce(mockStudentUser);
				accountService.findByUserIdOrFail.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));
				accountService.validatePassword.mockResolvedValueOnce(true);

				return { mockStudentAccount };
			};
			it('should throw Error', async () => {
				const { mockStudentAccount } = setup();
				await expect(
					accountUc.replaceMyTemporaryPassword(
						mockStudentAccount.userId?.toString() ?? '',
						defaultPassword,
						defaultPassword
					)
				).rejects.toThrow(Error);
			});
		});

		describe('When the admin manipulate the users password', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
					forcePasswordChange: true,
					preferences: { firstLogin: true },
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValueOnce(mockStudentUser);
				accountService.findByUserIdOrFail.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));
				accountService.validatePassword.mockResolvedValueOnce(false);
				return { mockStudentAccount };
			};
			it('should allow to set strong password', async () => {
				const { mockStudentAccount } = setup();

				await expect(
					accountUc.replaceMyTemporaryPassword(
						mockStudentAccount.userId?.toString() ?? '',
						otherPassword,
						otherPassword
					)
				).resolves.not.toThrow();
			});
		});

		describe('when a user logs in for the first time', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
					forcePasswordChange: false,
					preferences: { firstLogin: false },
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValueOnce(mockStudentUser);
				accountService.findByUserIdOrFail.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));
				accountService.validatePassword.mockResolvedValueOnce(false);

				return { mockStudentAccount };
			};
			it('should allow to set strong password', async () => {
				const { mockStudentAccount } = setup();

				await expect(
					accountUc.replaceMyTemporaryPassword(
						mockStudentAccount.userId?.toString() ?? '',
						otherPassword,
						otherPassword
					)
				).resolves.not.toThrow();
			});
		});

		describe('when a user logs in for the first time (if undefined)', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
					forcePasswordChange: false,
				});
				mockStudentUser.preferences = undefined;

				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValueOnce(mockStudentUser);
				accountService.findByUserIdOrFail.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));
				accountService.validatePassword.mockResolvedValueOnce(false);

				return { mockStudentAccount };
			};
			it('should allow to set strong password', async () => {
				const { mockStudentAccount } = setup();
				await expect(
					accountUc.replaceMyTemporaryPassword(
						mockStudentAccount.userId?.toString() ?? '',
						otherPassword,
						otherPassword
					)
				).resolves.not.toThrow();
			});
		});

		describe('When user can not be updated', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					firstName: 'failToUpdate',
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
					preferences: { firstLogin: false },
					forcePasswordChange: false,
				});

				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValueOnce(mockStudentUser);
				userRepo.save.mockRejectedValueOnce(undefined);
				accountService.findByUserIdOrFail.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));
				accountService.validatePassword.mockResolvedValueOnce(false);

				return { mockStudentAccount };
			};
			it('should throw EntityNotFoundError', async () => {
				const { mockStudentAccount } = setup();
				await expect(
					accountUc.replaceMyTemporaryPassword(
						mockStudentAccount.userId?.toString() ?? '',
						otherPassword,
						otherPassword
					)
				).rejects.toThrow(EntityNotFoundError);
			});
		});

		describe('When account can not be updated', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
					forcePasswordChange: false,
					preferences: { firstLogin: false },
				});

				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
					username: 'fail@to.update',
				});

				userRepo.findById.mockResolvedValueOnce(mockStudentUser);
				userRepo.save.mockResolvedValueOnce();
				accountService.findByUserIdOrFail.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));
				accountService.save.mockRejectedValueOnce(undefined);
				accountService.validatePassword.mockResolvedValueOnce(false);

				return { mockStudentAccount };
			};
			it('should throw EntityNotFoundError', async () => {
				const { mockStudentAccount } = setup();
				await expect(
					accountUc.replaceMyTemporaryPassword(
						mockStudentAccount.userId?.toString() ?? '',
						otherPassword,
						otherPassword
					)
				).rejects.toThrow(EntityNotFoundError);
			});
		});
	});

	describe('searchAccounts', () => {
		describe('When search type is userId', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();
				const mockSchoolWithStudentVisibility = schoolFactory.buildWithId();
				mockSchoolWithStudentVisibility.permissions = new SchoolRoles();
				mockSchoolWithStudentVisibility.permissions.teacher = new SchoolRolePermission();
				mockSchoolWithStudentVisibility.permissions.teacher.STUDENT_LIST = true;

				const mockSuperheroUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.SUPERHERO,
							permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
						}),
					],
				});
				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});

				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValueOnce(mockSuperheroUser).mockResolvedValueOnce(mockStudentUser);
				accountService.findByUserId.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));

				return { mockSuperheroUser, mockStudentUser, mockStudentAccount };
			};
			it('should return one account', async () => {
				const { mockSuperheroUser, mockStudentUser, mockStudentAccount } = setup();
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
		});

		describe('When account is not found', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockSuperheroUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.SUPERHERO,
							permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
						}),
					],
				});
				const mockUserWithoutAccount = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.ADMINISTRATOR,
							permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
						}),
					],
				});

				userRepo.findById.mockResolvedValueOnce(mockSuperheroUser).mockResolvedValueOnce(mockUserWithoutAccount);

				return { mockSuperheroUser, mockUserWithoutAccount };
			};
			it('should return empty list', async () => {
				const { mockSuperheroUser, mockUserWithoutAccount } = setup();
				const accounts = await accountUc.searchAccounts(
					{ userId: mockSuperheroUser.id } as ICurrentUser,
					{ type: AccountSearchType.USER_ID, value: mockUserWithoutAccount.id } as AccountSearchQueryParams
				);
				const expected = new AccountSearchListResponse([], 0, 0, 0);
				expect(accounts).toStrictEqual<AccountSearchListResponse>(expected);
			});
		});
		describe('When search type is username', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockSuperheroUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.SUPERHERO,
							permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
						}),
					],
				});
				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});

				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValueOnce(mockSuperheroUser).mockResolvedValueOnce(mockSuperheroUser);
				accountService.searchByUsernamePartialMatch.mockResolvedValueOnce([
					[
						AccountEntityToDtoMapper.mapToDto(mockStudentAccount),
						AccountEntityToDtoMapper.mapToDto(mockStudentAccount),
					],
					2,
				]);

				return { mockSuperheroUser };
			};
			it('should return one or more accounts, ', async () => {
				const { mockSuperheroUser } = setup();
				const accounts = await accountUc.searchAccounts(
					{ userId: mockSuperheroUser.id } as ICurrentUser,
					{ type: AccountSearchType.USERNAME, value: '' } as AccountSearchQueryParams
				);
				expect(accounts.skip).toEqual(0);
				expect(accounts.limit).toEqual(10);
				expect(accounts.total).toBeGreaterThan(1);
				expect(accounts.data.length).toBeGreaterThan(1);
			});
		});

		describe('When user has not the right permissions', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockAdminUser = userFactory.buildWithId({
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
				const mockTeacherUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.TEACHER,
							permissions: [Permission.STUDENT_EDIT, Permission.STUDENT_LIST, Permission.TEACHER_LIST],
						}),
					],
				});
				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockOtherStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});

				userRepo.findById.mockResolvedValueOnce(mockTeacherUser).mockResolvedValueOnce(mockAdminUser);
				userRepo.findById.mockResolvedValueOnce(mockStudentUser).mockResolvedValueOnce(mockOtherStudentUser);
				userRepo.findById.mockResolvedValueOnce(mockStudentUser).mockResolvedValueOnce(mockTeacherUser);

				return { mockTeacherUser, mockAdminUser, mockStudentUser, mockOtherStudentUser };
			};
			it('should throw ForbiddenOperationError', async () => {
				const { mockTeacherUser, mockAdminUser, mockStudentUser, mockOtherStudentUser } = setup();
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
		});

		describe('When search type is unknown', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockSuperheroUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.SUPERHERO,
							permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
						}),
					],
				});

				userRepo.findById.mockResolvedValueOnce(mockSuperheroUser);

				return { mockSuperheroUser };
			};
			it('should throw Invalid search type', async () => {
				const { mockSuperheroUser } = setup();
				await expect(
					accountUc.searchAccounts(
						{ userId: mockSuperheroUser.id } as ICurrentUser,
						{ type: '' as AccountSearchType } as AccountSearchQueryParams
					)
				).rejects.toThrow('Invalid search type.');
			});
		});

		describe('When user is not superhero', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockTeacherUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.TEACHER,
							permissions: [Permission.STUDENT_EDIT, Permission.STUDENT_LIST, Permission.TEACHER_LIST],
						}),
					],
				});
				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});

				userRepo.findById.mockResolvedValueOnce(mockTeacherUser).mockResolvedValueOnce(mockStudentUser);

				return { mockStudentUser, mockTeacherUser };
			};
			it('should throw ForbiddenOperationError', async () => {
				const { mockTeacherUser, mockStudentUser } = setup();
				await expect(
					accountUc.searchAccounts(
						{ userId: mockTeacherUser.id } as ICurrentUser,
						{ type: AccountSearchType.USERNAME, value: mockStudentUser.id } as AccountSearchQueryParams
					)
				).rejects.toThrow(ForbiddenOperationError);
			});
		});
		describe('hasPermissionsToAccessAccount', () => {
			describe('When using an admin', () => {
				const setup = () => {
					const mockSchool = schoolFactory.buildWithId();

					const mockAdminUser = userFactory.buildWithId({
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
					const mockTeacherUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [
							new Role({
								name: RoleName.TEACHER,
								permissions: [Permission.STUDENT_EDIT, Permission.STUDENT_LIST, Permission.TEACHER_LIST],
							}),
						],
					});

					configService.get.mockReturnValue(false);
					userRepo.findById.mockResolvedValueOnce(mockAdminUser).mockResolvedValueOnce(mockTeacherUser);

					return { mockAdminUser, mockTeacherUser };
				};
				it('should be able to access teacher of the same school via user id', async () => {
					const { mockAdminUser, mockTeacherUser } = setup();
					const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
					const params = { type: AccountSearchType.USER_ID, value: mockTeacherUser.id } as AccountSearchQueryParams;
					await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();
				});
			});

			describe('When using an admin', () => {
				const setup = () => {
					const mockSchool = schoolFactory.buildWithId();

					const mockAdminUser = userFactory.buildWithId({
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
					const mockStudentUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
					});

					configService.get.mockReturnValue(false);
					userRepo.findById.mockResolvedValueOnce(mockAdminUser).mockResolvedValueOnce(mockStudentUser);

					return { mockAdminUser, mockStudentUser };
				};
				it('should be able to access student of the same school via user id', async () => {
					const { mockAdminUser, mockStudentUser } = setup();
					const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
					const params = { type: AccountSearchType.USER_ID, value: mockStudentUser.id } as AccountSearchQueryParams;
					await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();
				});
			});

			describe('When using an admin', () => {
				const setup = () => {
					const mockSchool = schoolFactory.buildWithId();

					const mockAdminUser = userFactory.buildWithId({
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

					configService.get.mockReturnValue(false);
					userRepo.findById.mockResolvedValueOnce(mockAdminUser).mockResolvedValueOnce(mockAdminUser);

					return { mockAdminUser };
				};

				it('should not be able to access admin of the same school via user id', async () => {
					const { mockAdminUser } = setup();
					const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
					const params = { type: AccountSearchType.USER_ID, value: mockAdminUser.id } as AccountSearchQueryParams;
					await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();
				});
			});

			describe('When using an admin', () => {
				const setup = () => {
					const mockSchool = schoolFactory.buildWithId();
					const mockOtherSchool = schoolFactory.buildWithId();

					const mockAdminUser = userFactory.buildWithId({
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
					const mockTeacherUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [
							new Role({
								name: RoleName.TEACHER,
								permissions: [Permission.STUDENT_EDIT, Permission.STUDENT_LIST, Permission.TEACHER_LIST],
							}),
						],
					});
					const mockStudentUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
					});
					const mockDifferentSchoolAdminUser = userFactory.buildWithId({
						school: mockOtherSchool,
						roles: [...mockAdminUser.roles],
					});

					configService.get.mockReturnValue(false);
					userRepo.findById.mockResolvedValueOnce(mockDifferentSchoolAdminUser).mockResolvedValueOnce(mockTeacherUser);
					userRepo.findById.mockResolvedValueOnce(mockDifferentSchoolAdminUser).mockResolvedValueOnce(mockStudentUser);

					return { mockDifferentSchoolAdminUser, mockTeacherUser, mockStudentUser };
				};
				it('should not be able to access any account of a foreign school via user id', async () => {
					const { mockDifferentSchoolAdminUser, mockTeacherUser, mockStudentUser } = setup();
					const currentUser = { userId: mockDifferentSchoolAdminUser.id } as ICurrentUser;

					let params = { type: AccountSearchType.USER_ID, value: mockTeacherUser.id } as AccountSearchQueryParams;
					await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();

					params = { type: AccountSearchType.USER_ID, value: mockStudentUser.id } as AccountSearchQueryParams;
					await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();
				});
			});

			describe('When using a teacher', () => {
				const setup = () => {
					const mockSchool = schoolFactory.buildWithId();

					const mockTeacherUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [
							new Role({
								name: RoleName.TEACHER,
								permissions: [Permission.STUDENT_EDIT, Permission.STUDENT_LIST, Permission.TEACHER_LIST],
							}),
						],
					});
					const mockOtherTeacherUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [
							new Role({
								name: RoleName.TEACHER,
								permissions: [Permission.STUDENT_EDIT, Permission.STUDENT_LIST, Permission.TEACHER_LIST],
							}),
						],
					});

					configService.get.mockReturnValue(false);
					userRepo.findById.mockResolvedValueOnce(mockTeacherUser).mockResolvedValueOnce(mockOtherTeacherUser);

					return { mockTeacherUser, mockOtherTeacherUser };
				};
				it('should be able to access teacher of the same school via user id', async () => {
					const { mockTeacherUser, mockOtherTeacherUser } = setup();
					const currentUser = { userId: mockTeacherUser.id } as ICurrentUser;
					const params = {
						type: AccountSearchType.USER_ID,
						value: mockOtherTeacherUser.id,
					} as AccountSearchQueryParams;
					await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();
				});
			});

			describe('When using a teacher', () => {
				const setup = () => {
					const mockSchool = schoolFactory.buildWithId();

					const mockTeacherUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [
							new Role({
								name: RoleName.TEACHER,
								permissions: [Permission.STUDENT_EDIT, Permission.STUDENT_LIST, Permission.TEACHER_LIST],
							}),
						],
					});
					const mockStudentUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
					});

					configService.get.mockReturnValue(false);
					userRepo.findById.mockResolvedValueOnce(mockTeacherUser).mockResolvedValueOnce(mockStudentUser);

					return { mockTeacherUser, mockStudentUser };
				};
				it('should be able to access student of the same school via user id', async () => {
					const { mockTeacherUser, mockStudentUser } = setup();
					const currentUser = { userId: mockTeacherUser.id } as ICurrentUser;
					const params = { type: AccountSearchType.USER_ID, value: mockStudentUser.id } as AccountSearchQueryParams;
					await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();
				});
			});

			describe('When using a teacher', () => {
				const setup = () => {
					const mockSchool = schoolFactory.buildWithId();

					const mockAdminUser = userFactory.buildWithId({
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
					const mockTeacherUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [
							new Role({
								name: RoleName.TEACHER,
								permissions: [Permission.STUDENT_EDIT, Permission.STUDENT_LIST, Permission.TEACHER_LIST],
							}),
						],
					});

					configService.get.mockReturnValue(false);
					userRepo.findById.mockResolvedValueOnce(mockTeacherUser).mockResolvedValueOnce(mockAdminUser);

					return { mockTeacherUser, mockAdminUser };
				};
				it('should not be able to access admin of the same school via user id', async () => {
					const { mockTeacherUser, mockAdminUser } = setup();
					const currentUser = { userId: mockTeacherUser.id } as ICurrentUser;
					const params = { type: AccountSearchType.USER_ID, value: mockAdminUser.id } as AccountSearchQueryParams;
					await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();
				});
			});

			describe('When using a teacher', () => {
				const setup = () => {
					const mockSchool = schoolFactory.buildWithId();
					const mockOtherSchool = schoolFactory.buildWithId();

					const mockTeacherUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [
							new Role({
								name: RoleName.TEACHER,
								permissions: [Permission.STUDENT_EDIT, Permission.STUDENT_LIST, Permission.TEACHER_LIST],
							}),
						],
					});
					const mockStudentUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
					});
					const mockDifferentSchoolTeacherUser = userFactory.buildWithId({
						school: mockOtherSchool,
						roles: [...mockTeacherUser.roles],
					});

					configService.get.mockReturnValue(false);
					userRepo.findById
						.mockResolvedValueOnce(mockDifferentSchoolTeacherUser)
						.mockResolvedValueOnce(mockTeacherUser);
					userRepo.findById
						.mockResolvedValueOnce(mockDifferentSchoolTeacherUser)
						.mockResolvedValueOnce(mockStudentUser);

					return { mockDifferentSchoolTeacherUser, mockTeacherUser, mockStudentUser };
				};
				it('should not be able to access any account of a foreign school via user id', async () => {
					const { mockDifferentSchoolTeacherUser, mockTeacherUser, mockStudentUser } = setup();
					const currentUser = { userId: mockDifferentSchoolTeacherUser.id } as ICurrentUser;

					let params = { type: AccountSearchType.USER_ID, value: mockTeacherUser.id } as AccountSearchQueryParams;
					await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();

					params = { type: AccountSearchType.USER_ID, value: mockStudentUser.id } as AccountSearchQueryParams;
					await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();
				});
			});
			describe('When using a teacher', () => {
				const setup = () => {
					const mockSchoolWithStudentVisibility = schoolFactory.buildWithId();
					mockSchoolWithStudentVisibility.permissions = new SchoolRoles();
					mockSchoolWithStudentVisibility.permissions.teacher = new SchoolRolePermission();
					mockSchoolWithStudentVisibility.permissions.teacher.STUDENT_LIST = true;

					const mockTeacherNoUserPermissionUser = userFactory.buildWithId({
						school: mockSchoolWithStudentVisibility,
						roles: [
							new Role({
								name: RoleName.TEACHER,
								permissions: [],
							}),
						],
					});
					const mockStudentSchoolPermissionUser = userFactory.buildWithId({
						school: mockSchoolWithStudentVisibility,
						roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
					});

					configService.get.mockReturnValue(true);
					userRepo.findById
						.mockResolvedValueOnce(mockTeacherNoUserPermissionUser)
						.mockResolvedValueOnce(mockStudentSchoolPermissionUser);

					return { mockTeacherNoUserPermissionUser, mockStudentSchoolPermissionUser };
				};
				it('should be able to access student of the same school via user id if school has global permission', async () => {
					const { mockTeacherNoUserPermissionUser, mockStudentSchoolPermissionUser } = setup();

					const currentUser = { userId: mockTeacherNoUserPermissionUser.id } as ICurrentUser;
					const params = {
						type: AccountSearchType.USER_ID,
						value: mockStudentSchoolPermissionUser.id,
					} as AccountSearchQueryParams;
					await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();
				});
			});

			describe('When using a teacher', () => {
				const setup = () => {
					const mockSchool = schoolFactory.buildWithId();

					const mockTeacherNoUserNoSchoolPermissionUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [
							new Role({
								name: RoleName.TEACHER,
								permissions: [],
							}),
						],
					});
					const mockStudentUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
					});

					configService.get.mockReturnValue(false);
					userRepo.findById
						.mockResolvedValueOnce(mockTeacherNoUserNoSchoolPermissionUser)
						.mockResolvedValueOnce(mockStudentUser);

					return { mockTeacherNoUserNoSchoolPermissionUser, mockStudentUser };
				};
				it('should not be able to access student of the same school if school has no global permission', async () => {
					const { mockTeacherNoUserNoSchoolPermissionUser, mockStudentUser } = setup();
					configService.get.mockReturnValue(true);
					const currentUser = { userId: mockTeacherNoUserNoSchoolPermissionUser.id } as ICurrentUser;
					const params = { type: AccountSearchType.USER_ID, value: mockStudentUser.id } as AccountSearchQueryParams;
					await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow(ForbiddenOperationError);
				});
			});

			describe('When using a student', () => {
				const setup = () => {
					const mockSchoolWithStudentVisibility = schoolFactory.buildWithId();
					mockSchoolWithStudentVisibility.permissions = new SchoolRoles();
					mockSchoolWithStudentVisibility.permissions.teacher = new SchoolRolePermission();
					mockSchoolWithStudentVisibility.permissions.teacher.STUDENT_LIST = true;

					const mockStudentSchoolPermissionUser = userFactory.buildWithId({
						school: mockSchoolWithStudentVisibility,
						roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
					});
					const mockOtherStudentSchoolPermissionUser = userFactory.buildWithId({
						school: mockSchoolWithStudentVisibility,
						roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
					});

					configService.get.mockReturnValue(false);
					userRepo.findById
						.mockResolvedValueOnce(mockStudentSchoolPermissionUser)
						.mockResolvedValueOnce(mockOtherStudentSchoolPermissionUser);

					return { mockStudentSchoolPermissionUser, mockOtherStudentSchoolPermissionUser };
				};
				it('should not be able to access student of the same school if school has global permission', async () => {
					const { mockStudentSchoolPermissionUser, mockOtherStudentSchoolPermissionUser } = setup();
					configService.get.mockReturnValue(true);
					const currentUser = { userId: mockStudentSchoolPermissionUser.id } as ICurrentUser;
					const params = {
						type: AccountSearchType.USER_ID,
						value: mockOtherStudentSchoolPermissionUser.id,
					} as AccountSearchQueryParams;
					await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow(ForbiddenOperationError);
				});
			});

			describe('When using a student', () => {
				const setup = () => {
					const mockSchool = schoolFactory.buildWithId();

					const mockAdminUser = userFactory.buildWithId({
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
					const mockTeacherUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [
							new Role({
								name: RoleName.TEACHER,
								permissions: [Permission.STUDENT_EDIT, Permission.STUDENT_LIST, Permission.TEACHER_LIST],
							}),
						],
					});
					const mockStudentUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
					});

					configService.get.mockReturnValue(false);
					userRepo.findById.mockResolvedValueOnce(mockStudentUser).mockResolvedValueOnce(mockAdminUser);
					userRepo.findById.mockResolvedValueOnce(mockStudentUser).mockResolvedValueOnce(mockTeacherUser);
					userRepo.findById.mockResolvedValueOnce(mockStudentUser).mockResolvedValueOnce(mockStudentUser);

					return { mockStudentUser, mockAdminUser, mockTeacherUser };
				};
				it('should not be able to access any other account via user id', async () => {
					const { mockStudentUser, mockAdminUser, mockTeacherUser } = setup();
					const currentUser = { userId: mockStudentUser.id } as ICurrentUser;

					let params = { type: AccountSearchType.USER_ID, value: mockAdminUser.id } as AccountSearchQueryParams;
					await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();

					params = { type: AccountSearchType.USER_ID, value: mockTeacherUser.id } as AccountSearchQueryParams;
					await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();

					params = { type: AccountSearchType.USER_ID, value: mockStudentUser.id } as AccountSearchQueryParams;
					await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();
				});
			});

			describe('When using a superhero', () => {
				const setup = () => {
					const mockSchool = schoolFactory.buildWithId();
					const mockOtherSchool = schoolFactory.buildWithId();

					const mockSuperheroUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [
							new Role({
								name: RoleName.SUPERHERO,
								permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
							}),
						],
					});
					const mockAdminUser = userFactory.buildWithId({
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
					const mockTeacherUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [
							new Role({
								name: RoleName.TEACHER,
								permissions: [Permission.STUDENT_EDIT, Permission.STUDENT_LIST, Permission.TEACHER_LIST],
							}),
						],
					});
					const mockStudentUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
					});
					const mockDifferentSchoolAdminUser = userFactory.buildWithId({
						school: mockOtherSchool,
						roles: [...mockAdminUser.roles],
					});
					const mockDifferentSchoolTeacherUser = userFactory.buildWithId({
						school: mockOtherSchool,
						roles: [...mockTeacherUser.roles],
					});
					const mockDifferentSchoolStudentUser = userFactory.buildWithId({
						school: mockOtherSchool,
						roles: [...mockStudentUser.roles],
					});

					const mockStudentAccount = accountFactory.buildWithId({
						userId: mockStudentUser.id,
						password: defaultPasswordHash,
					});
					const mockDifferentSchoolAdminAccount = accountFactory.buildWithId({
						userId: mockDifferentSchoolAdminUser.id,
						password: defaultPasswordHash,
					});
					const mockDifferentSchoolTeacherAccount = accountFactory.buildWithId({
						userId: mockDifferentSchoolTeacherUser.id,
						password: defaultPasswordHash,
					});
					const mockAdminAccount = accountFactory.buildWithId({
						userId: mockAdminUser.id,
						password: defaultPasswordHash,
					});
					const mockTeacherAccount = accountFactory.buildWithId({
						userId: mockTeacherUser.id,
						password: defaultPasswordHash,
					});

					const mockDifferentSchoolStudentAccount = accountFactory.buildWithId({
						userId: mockDifferentSchoolStudentUser.id,
						password: defaultPasswordHash,
					});

					configService.get.mockReturnValue(false);
					userRepo.findById.mockResolvedValue(mockSuperheroUser);
					accountService.searchByUsernamePartialMatch.mockResolvedValue([[], 0]);

					return {
						mockSuperheroUser,
						mockAdminAccount,
						mockTeacherAccount,
						mockStudentAccount,
						mockDifferentSchoolAdminAccount,
						mockDifferentSchoolTeacherAccount,
						mockDifferentSchoolStudentAccount,
					};
				};
				it('should be able to access any account via username', async () => {
					const {
						mockSuperheroUser,
						mockAdminAccount,
						mockTeacherAccount,
						mockStudentAccount,
						mockDifferentSchoolAdminAccount,
						mockDifferentSchoolTeacherAccount,
						mockDifferentSchoolStudentAccount,
					} = setup();

					const currentUser = { userId: mockSuperheroUser.id } as ICurrentUser;

					let params = {
						type: AccountSearchType.USERNAME,
						value: mockAdminAccount.username,
					} as AccountSearchQueryParams;
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
	});

	describe('findAccountById', () => {
		describe('When the current user is a superhero', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockSuperheroUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.SUPERHERO,
							permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
						}),
					],
				});
				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValueOnce(mockSuperheroUser);
				accountService.findById.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));

				return { mockSuperheroUser, mockStudentUser, mockStudentAccount };
			};
			it('should return an account', async () => {
				const { mockSuperheroUser, mockStudentUser, mockStudentAccount } = setup();
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
		});

		describe('When the current user is no superhero', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockTeacherUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.TEACHER,
							permissions: [Permission.STUDENT_EDIT, Permission.STUDENT_LIST, Permission.TEACHER_LIST],
						}),
					],
				});
				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValueOnce(mockTeacherUser);

				return { mockTeacherUser, mockStudentAccount };
			};
			it('should throw ForbiddenOperationError', async () => {
				const { mockTeacherUser, mockStudentAccount } = setup();
				await expect(
					accountUc.findAccountById(
						{ userId: mockTeacherUser.id } as ICurrentUser,
						{ id: mockStudentAccount.id } as AccountByIdParams
					)
				).rejects.toThrow(ForbiddenOperationError);
			});
		});

		describe('When no account matches the search term', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockSuperheroUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.SUPERHERO,
							permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
						}),
					],
				});

				userRepo.findById.mockResolvedValueOnce(mockSuperheroUser);
				accountService.findById.mockImplementation((): Promise<AccountDto> => {
					throw new EntityNotFoundError(Account.name);
				});

				return { mockSuperheroUser };
			};
			it('should throw EntityNotFoundError', async () => {
				const { mockSuperheroUser } = setup();
				await expect(
					accountUc.findAccountById(
						{ userId: mockSuperheroUser.id } as ICurrentUser,
						{ id: 'xxx' } as AccountByIdParams
					)
				).rejects.toThrow(EntityNotFoundError);
			});
		});

		describe('When target account has no user', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockSuperheroUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.SUPERHERO,
							permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
						}),
					],
				});

				userRepo.findById.mockResolvedValueOnce(mockSuperheroUser);
				accountService.findById.mockImplementation((): Promise<AccountDto> => {
					throw new EntityNotFoundError(Account.name);
				});

				return { mockSuperheroUser };
			};
			it('should throw EntityNotFoundError', async () => {
				const { mockSuperheroUser } = setup();
				await expect(
					accountUc.findAccountById(
						{ userId: mockSuperheroUser.id } as ICurrentUser,
						{ id: 'xxx' } as AccountByIdParams
					)
				).rejects.toThrow(EntityNotFoundError);
			});
		});
	});

	describe('saveAccount', () => {
		describe('When saving an account', () => {
			const setup = () => {
				const spy = jest.spyOn(accountService, 'saveWithValidation');

				return { spy };
			};
			it('should call account service', async () => {
				const { spy } = setup();

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
	});

	describe('updateAccountById', () => {
		describe('when updating a user that does not exist', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockImplementation((): Promise<User> => {
					throw new EntityNotFoundError(User.name);
				});

				return { mockStudentAccount };
			};
			it('should throw EntityNotFoundError', async () => {
				const { mockStudentAccount } = setup();
				const currentUser = { userId: '000000000000000' } as ICurrentUser;
				const params = { id: mockStudentAccount.id } as AccountByIdParams;
				const body = {} as AccountByIdBodyParams;
				await expect(accountUc.updateAccountById(currentUser, params, body)).rejects.toThrow(EntityNotFoundError);
			});
		});

		describe('When target account does not exist', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockAdminUser = userFactory.buildWithId({
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

				const mockAccountWithoutUser = accountFactory.buildWithId({
					userId: undefined,
					password: defaultPasswordHash,
					systemId: systemFactory.buildWithId().id,
				});

				userRepo.findById.mockResolvedValue(mockAdminUser);
				accountService.findById.mockResolvedValue(AccountEntityToDtoMapper.mapToDto(mockAccountWithoutUser));

				return { mockAdminUser };
			};
			it('should throw EntityNotFoundError', async () => {
				const { mockAdminUser } = setup();
				const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
				const params = { id: '000000000000000' } as AccountByIdParams;
				const body = {} as AccountByIdBodyParams;
				await expect(accountUc.updateAccountById(currentUser, params, body)).rejects.toThrow(EntityNotFoundError);
			});
		});

		describe('When using superhero user', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockSuperheroUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.SUPERHERO,
							permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
						}),
					],
				});
				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValueOnce(mockSuperheroUser).mockResolvedValueOnce(mockStudentUser);
				accountService.findById.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));

				userRepo.save.mockResolvedValue();
				accountService.save.mockImplementation((account: AccountSaveDto): Promise<AccountDto> => {
					Object.assign(mockStudentAccount, account);
					return Promise.resolve(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));
				});

				return { mockStudentAccount, mockStudentUser, mockSuperheroUser };
			};
			it('should update target account password', async () => {
				const { mockStudentAccount, mockSuperheroUser, mockStudentUser } = setup();
				const previousPasswordHash = mockStudentAccount.password;
				const currentUser = { userId: mockSuperheroUser.id } as ICurrentUser;
				const params = { id: mockStudentAccount.id } as AccountByIdParams;
				const body = { password: defaultPassword } as AccountByIdBodyParams;
				expect(mockStudentUser.forcePasswordChange).toBeFalsy();
				await accountUc.updateAccountById(currentUser, params, body);
				expect(mockStudentAccount.password).not.toBe(previousPasswordHash);
				expect(mockStudentUser.forcePasswordChange).toBeTruthy();
			});
		});

		describe('When using superhero user', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockSuperheroUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.SUPERHERO,
							permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
						}),
					],
				});
				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValueOnce(mockSuperheroUser).mockResolvedValueOnce(mockStudentUser);
				accountService.findById.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));

				userRepo.save.mockResolvedValue();
				accountService.save.mockImplementation((account: AccountSaveDto): Promise<AccountDto> => {
					Object.assign(mockStudentAccount, account);
					return Promise.resolve(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));
				});
				accountValidationService.isUniqueEmail.mockResolvedValue(true);

				return { mockStudentAccount, mockSuperheroUser };
			};
			it('should update target account username', async () => {
				const { mockStudentAccount, mockSuperheroUser } = setup();
				const newUsername = 'newUsername';
				const currentUser = { userId: mockSuperheroUser.id } as ICurrentUser;
				const params = { id: mockStudentAccount.id } as AccountByIdParams;
				const body = { username: newUsername } as AccountByIdBodyParams;
				expect(mockStudentAccount.username).not.toBe(newUsername);
				await accountUc.updateAccountById(currentUser, params, body);
				expect(mockStudentAccount.username).toBe(newUsername.toLowerCase());
			});
		});

		describe('When using superhero user', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockSuperheroUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.SUPERHERO,
							permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
						}),
					],
				});
				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValueOnce(mockSuperheroUser).mockResolvedValueOnce(mockStudentUser);
				accountService.findById.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));

				userRepo.save.mockResolvedValue();
				accountService.save.mockImplementation((account: AccountSaveDto): Promise<AccountDto> => {
					Object.assign(mockStudentAccount, account);
					return Promise.resolve(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));
				});

				return { mockStudentAccount, mockSuperheroUser };
			};
			it('should update target account activation state', async () => {
				const { mockStudentAccount, mockSuperheroUser } = setup();
				const currentUser = { userId: mockSuperheroUser.id } as ICurrentUser;
				const params = { id: mockStudentAccount.id } as AccountByIdParams;
				const body = { activated: false } as AccountByIdBodyParams;
				await accountUc.updateAccountById(currentUser, params, body);
				expect(mockStudentAccount.activated).toBeFalsy();
			});
		});

		describe('When using an admin user', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockAdminUser = userFactory.buildWithId({
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
				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValueOnce(mockAdminUser).mockResolvedValueOnce(mockStudentUser);
				accountService.findById.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));

				userRepo.save.mockResolvedValue();
				accountService.save.mockRejectedValueOnce(undefined);

				accountValidationService.isUniqueEmail.mockResolvedValue(true);

				return { mockStudentAccount, mockAdminUser };
			};
			it('should throw if account can not be updated', async () => {
				const { mockStudentAccount, mockAdminUser } = setup();
				const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
				const params = { id: mockStudentAccount.id } as AccountByIdParams;
				const body = { username: 'fail@to.update' } as AccountByIdBodyParams;
				await expect(accountUc.updateAccountById(currentUser, params, body)).rejects.toThrow(EntityNotFoundError);
			});
		});

		describe('When user can not be updated', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockAdminUser = userFactory.buildWithId({
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
				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValueOnce(mockAdminUser).mockResolvedValueOnce(mockStudentUser);
				accountService.findById.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));

				userRepo.save.mockRejectedValueOnce(undefined);

				accountValidationService.isUniqueEmail.mockResolvedValue(true);

				return { mockStudentAccount, mockAdminUser };
			};
			it('should throw EntityNotFoundError', async () => {
				const { mockStudentAccount, mockAdminUser } = setup();
				const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
				const params = { id: mockStudentAccount.id } as AccountByIdParams;
				const body = { username: 'user-fail@to.update' } as AccountByIdBodyParams;
				await expect(accountUc.updateAccountById(currentUser, params, body)).rejects.toThrow(EntityNotFoundError);
			});
		});

		describe('if target account has no user', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockSuperheroUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.SUPERHERO,
							permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
						}),
					],
				});
				const mockAccountWithoutUser = accountFactory.buildWithId({
					userId: undefined,
					password: defaultPasswordHash,
					systemId: systemFactory.buildWithId().id,
				});

				userRepo.findById.mockResolvedValueOnce(mockSuperheroUser);
				accountService.findById.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockAccountWithoutUser));

				return { mockSuperheroUser, mockAccountWithoutUser };
			};

			it('should throw EntityNotFoundError', async () => {
				const { mockSuperheroUser, mockAccountWithoutUser } = setup();
				await expect(
					accountUc.updateAccountById(
						{ userId: mockSuperheroUser.id } as ICurrentUser,
						{ id: mockAccountWithoutUser.id } as AccountByIdParams,
						{ username: 'user-fail@to.update' } as AccountByIdBodyParams
					)
				).rejects.toThrow(EntityNotFoundError);
			});
		});

		describe('When new username already in use', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockAdminUser = userFactory.buildWithId({
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
				const mockOtherTeacherUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.TEACHER,
							permissions: [Permission.STUDENT_EDIT, Permission.STUDENT_LIST, Permission.TEACHER_LIST],
						}),
					],
				});
				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});

				const mockOtherTeacherAccount = accountFactory.buildWithId({
					userId: mockOtherTeacherUser.id,
					password: defaultPasswordHash,
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValueOnce(mockAdminUser).mockResolvedValueOnce(mockStudentUser);
				accountService.findById.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));

				userRepo.save.mockRejectedValueOnce(undefined);

				accountValidationService.isUniqueEmail.mockResolvedValueOnce(false);

				return { mockStudentAccount, mockAdminUser, mockOtherTeacherAccount };
			};
			it('should throw ValidationError', async () => {
				const { mockStudentAccount, mockAdminUser, mockOtherTeacherAccount } = setup();
				const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
				const params = { id: mockStudentAccount.id } as AccountByIdParams;
				const body = { username: mockOtherTeacherAccount.username } as AccountByIdBodyParams;
				await expect(accountUc.updateAccountById(currentUser, params, body)).rejects.toThrow(ValidationError);
			});
		});

		describe('hasPermissionsToUpdateAccount', () => {
			describe('When using an admin user', () => {
				const setup = () => {
					const mockSchool = schoolFactory.buildWithId();

					const mockAdminUser = userFactory.buildWithId({
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
					const mockTeacherUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [
							new Role({
								name: RoleName.TEACHER,
								permissions: [Permission.STUDENT_EDIT, Permission.STUDENT_LIST, Permission.TEACHER_LIST],
							}),
						],
					});

					const mockTeacherAccount = accountFactory.buildWithId({
						userId: mockTeacherUser.id,
						password: defaultPasswordHash,
					});

					userRepo.findById.mockResolvedValueOnce(mockAdminUser).mockResolvedValueOnce(mockTeacherUser);
					accountService.findById.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockTeacherAccount));

					return { mockAdminUser, mockTeacherAccount };
				};
				it('should not throw error when editing a teacher', async () => {
					const { mockAdminUser, mockTeacherAccount } = setup();
					const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
					const params = { id: mockTeacherAccount.id } as AccountByIdParams;
					const body = {} as AccountByIdBodyParams;
					await expect(accountUc.updateAccountById(currentUser, params, body)).resolves.not.toThrow();
				});
			});

			describe('When using a teacher user', () => {
				const setup = () => {
					const mockSchool = schoolFactory.buildWithId();

					const mockTeacherUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [
							new Role({
								name: RoleName.TEACHER,
								permissions: [Permission.STUDENT_EDIT, Permission.STUDENT_LIST, Permission.TEACHER_LIST],
							}),
						],
					});
					const mockStudentUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
					});
					const mockStudentAccount = accountFactory.buildWithId({
						userId: mockStudentUser.id,
						password: defaultPasswordHash,
					});

					userRepo.findById.mockResolvedValueOnce(mockTeacherUser).mockResolvedValueOnce(mockStudentUser);
					accountService.findById.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));

					return { mockStudentAccount, mockTeacherUser };
				};
				it('should not throw error when editing a student', async () => {
					const { mockTeacherUser, mockStudentAccount } = setup();
					const currentUser = { userId: mockTeacherUser.id } as ICurrentUser;
					const params = { id: mockStudentAccount.id } as AccountByIdParams;
					const body = {} as AccountByIdBodyParams;
					await expect(accountUc.updateAccountById(currentUser, params, body)).resolves.not.toThrow();
				});
			});
			describe('When using an admin user', () => {
				const setup = () => {
					const mockSchool = schoolFactory.buildWithId();

					const mockAdminUser = userFactory.buildWithId({
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
					const mockStudentUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
					});
					const mockStudentAccount = accountFactory.buildWithId({
						userId: mockStudentUser.id,
						password: defaultPasswordHash,
					});

					userRepo.findById.mockResolvedValueOnce(mockAdminUser).mockResolvedValueOnce(mockStudentUser);
					accountService.findById.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));

					return { mockStudentAccount, mockAdminUser };
				};
				it('should not throw error when editing a student', async () => {
					const { mockAdminUser, mockStudentAccount } = setup();
					const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
					const params = { id: mockStudentAccount.id } as AccountByIdParams;
					const body = {} as AccountByIdBodyParams;
					await expect(accountUc.updateAccountById(currentUser, params, body)).resolves.not.toThrow();
				});
			});

			describe('When using a teacher user to edit another teacher', () => {
				const setup = () => {
					const mockSchool = schoolFactory.buildWithId();

					const mockTeacherUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [
							new Role({
								name: RoleName.TEACHER,
								permissions: [Permission.STUDENT_EDIT, Permission.STUDENT_LIST, Permission.TEACHER_LIST],
							}),
						],
					});
					const mockOtherTeacherUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [
							new Role({
								name: RoleName.TEACHER,
								permissions: [Permission.STUDENT_EDIT, Permission.STUDENT_LIST, Permission.TEACHER_LIST],
							}),
						],
					});
					const mockOtherTeacherAccount = accountFactory.buildWithId({
						userId: mockOtherTeacherUser.id,
						password: defaultPasswordHash,
					});

					userRepo.findById.mockResolvedValueOnce(mockTeacherUser).mockResolvedValueOnce(mockOtherTeacherUser);
					accountService.findById.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockOtherTeacherAccount));

					return { mockOtherTeacherAccount, mockTeacherUser };
				};
				it('should throw ForbiddenOperationError', async () => {
					const { mockTeacherUser, mockOtherTeacherAccount } = setup();
					const currentUser = { userId: mockTeacherUser.id } as ICurrentUser;
					const params = { id: mockOtherTeacherAccount.id } as AccountByIdParams;
					const body = {} as AccountByIdBodyParams;
					await expect(accountUc.updateAccountById(currentUser, params, body)).rejects.toThrow(ForbiddenOperationError);
				});
			});

			describe('When using an admin user of other school', () => {
				const setup = () => {
					const mockSchool = schoolFactory.buildWithId();
					const mockOtherSchool = schoolFactory.buildWithId();

					const mockAdminUser = userFactory.buildWithId({
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
					const mockTeacherUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [
							new Role({
								name: RoleName.TEACHER,
								permissions: [Permission.STUDENT_EDIT, Permission.STUDENT_LIST, Permission.TEACHER_LIST],
							}),
						],
					});
					const mockDifferentSchoolAdminUser = userFactory.buildWithId({
						school: mockOtherSchool,
						roles: [...mockAdminUser.roles],
					});

					const mockTeacherAccount = accountFactory.buildWithId({
						userId: mockTeacherUser.id,
						password: defaultPasswordHash,
					});

					userRepo.findById.mockResolvedValueOnce(mockDifferentSchoolAdminUser).mockResolvedValueOnce(mockTeacherUser);
					accountService.findById.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockTeacherAccount));

					return { mockDifferentSchoolAdminUser, mockTeacherAccount };
				};
				it('should throw ForbiddenOperationError', async () => {
					const { mockDifferentSchoolAdminUser, mockTeacherAccount } = setup();
					const currentUser = { userId: mockDifferentSchoolAdminUser.id } as ICurrentUser;
					const params = { id: mockTeacherAccount.id } as AccountByIdParams;
					const body = {} as AccountByIdBodyParams;
					await expect(accountUc.updateAccountById(currentUser, params, body)).rejects.toThrow(ForbiddenOperationError);
				});
			});

			describe('When using a superhero user', () => {
				const setup = () => {
					const mockSchool = schoolFactory.buildWithId();

					const mockSuperheroUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [
							new Role({
								name: RoleName.SUPERHERO,
								permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
							}),
						],
					});
					const mockAdminUser = userFactory.buildWithId({
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
					const mockAdminAccount = accountFactory.buildWithId({
						userId: mockAdminUser.id,
						password: defaultPasswordHash,
					});

					userRepo.findById.mockResolvedValueOnce(mockSuperheroUser).mockResolvedValueOnce(mockAdminUser);
					accountService.findById.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockAdminAccount));

					return { mockAdminAccount, mockSuperheroUser };
				};
				it('should not throw error when editing a admin', async () => {
					const { mockSuperheroUser, mockAdminAccount } = setup();
					const currentUser = { userId: mockSuperheroUser.id } as ICurrentUser;
					const params = { id: mockAdminAccount.id } as AccountByIdParams;
					const body = {} as AccountByIdBodyParams;
					await expect(accountUc.updateAccountById(currentUser, params, body)).resolves.not.toThrow();
				});
			});

			describe('When using an user with undefined role', () => {
				const setup = () => {
					const mockSchool = schoolFactory.buildWithId();

					const mockUserWithoutRole = userFactory.buildWithId({
						school: mockSchool,
						roles: [],
					});
					const mockUnknownRoleUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [new Role({ name: 'undefinedRole' as RoleName, permissions: ['' as Permission] })],
					});
					const mockAccountWithoutRole = accountFactory.buildWithId({
						userId: mockUserWithoutRole.id,
						password: defaultPasswordHash,
					});

					userRepo.findById.mockResolvedValueOnce(mockUnknownRoleUser).mockResolvedValueOnce(mockUserWithoutRole);
					accountService.findById.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockAccountWithoutRole));

					return { mockAccountWithoutRole, mockUnknownRoleUser };
				};
				it('should fail by default', async () => {
					const { mockUnknownRoleUser, mockAccountWithoutRole } = setup();
					const currentUser = { userId: mockUnknownRoleUser.id } as ICurrentUser;
					const params = { id: mockAccountWithoutRole.id } as AccountByIdParams;
					const body = {} as AccountByIdBodyParams;
					await expect(accountUc.updateAccountById(currentUser, params, body)).rejects.toThrow(ForbiddenOperationError);
				});
			});

			describe('When editing an user without role', () => {
				const setup = () => {
					const mockSchool = schoolFactory.buildWithId();

					const mockAdminUser = userFactory.buildWithId({
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
					const mockUnknownRoleUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [new Role({ name: 'undefinedRole' as RoleName, permissions: ['' as Permission] })],
					});
					const mockUnknownRoleUserAccount = accountFactory.buildWithId({
						userId: mockUnknownRoleUser.id,
						password: defaultPasswordHash,
					});

					userRepo.findById.mockResolvedValueOnce(mockAdminUser).mockResolvedValueOnce(mockUnknownRoleUser);
					accountService.findById.mockResolvedValueOnce(AccountEntityToDtoMapper.mapToDto(mockUnknownRoleUserAccount));

					return { mockAdminUser, mockUnknownRoleUserAccount };
				};
				it('should throw ForbiddenOperationError', async () => {
					const { mockAdminUser, mockUnknownRoleUserAccount } = setup();
					const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
					const params = { id: mockUnknownRoleUserAccount.id } as AccountByIdParams;
					const body = {} as AccountByIdBodyParams;
					await expect(accountUc.updateAccountById(currentUser, params, body)).rejects.toThrow(ForbiddenOperationError);
				});
			});
		});
	});

	describe('deleteAccountById', () => {
		describe('When current user is authorized', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockSuperheroUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.SUPERHERO,
							permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
						}),
					],
				});
				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});

				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockResolvedValue(mockSuperheroUser);

				accountService.findById.mockResolvedValue(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));

				return { mockSuperheroUser, mockStudentAccount };
			};
			it('should delete an account', async () => {
				const { mockSuperheroUser, mockStudentAccount } = setup();
				await expect(
					accountUc.deleteAccountById(
						{ userId: mockSuperheroUser.id } as ICurrentUser,
						{ id: mockStudentAccount.id } as AccountByIdParams
					)
				).resolves.not.toThrow();
			});
		});

		describe('When the current user is not superhero', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockAdminUser = userFactory.buildWithId({
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

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});

				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userRepo.findById.mockImplementation((userId: EntityId): Promise<User> => {
					if (mockAdminUser.id === userId) {
						return Promise.resolve(mockAdminUser);
					}
					throw new EntityNotFoundError(User.name);
				});

				return { mockAdminUser, mockStudentAccount };
			};
			it('should throw ForbiddenOperationError', async () => {
				const { mockAdminUser, mockStudentAccount } = setup();
				await expect(
					accountUc.deleteAccountById(
						{ userId: mockAdminUser.id } as ICurrentUser,
						{ id: mockStudentAccount.id } as AccountByIdParams
					)
				).rejects.toThrow(ForbiddenOperationError);
			});
		});

		describe('When no account matches the search term', () => {
			const setup = () => {
				const mockSchool = schoolFactory.buildWithId();

				const mockSuperheroUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.SUPERHERO,
							permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
						}),
					],
				});

				userRepo.findById.mockImplementation((userId: EntityId): Promise<User> => {
					if (mockSuperheroUser.id === userId) {
						return Promise.resolve(mockSuperheroUser);
					}
					throw new EntityNotFoundError(User.name);
				});

				accountService.findById.mockImplementation((id: EntityId): Promise<AccountDto> => {
					if (id === 'xxx') {
						throw new EntityNotFoundError(Account.name);
					}
					return Promise.reject();
				});

				return { mockSuperheroUser };
			};
			it('should throw, if no account matches the search term', async () => {
				const { mockSuperheroUser } = setup();
				await expect(
					accountUc.deleteAccountById(
						{ userId: mockSuperheroUser.id } as ICurrentUser,
						{ id: 'xxx' } as AccountByIdParams
					)
				).rejects.toThrow(EntityNotFoundError);
			});
		});
	});

	describe('checkBrutForce', () => {
		describe('When time difference < the allowed time', () => {
			const setup = () => {
				const mockAccountWithLastFailedLogin = accountFactory.buildWithId({
					userId: undefined,
					password: defaultPasswordHash,
					systemId: systemFactory.buildWithId().id,
					lasttriedFailedLogin: new Date(),
				});

				configService.get.mockReturnValue(LOGIN_BLOCK_TIME);

				accountService.findByUsernameAndSystemId.mockImplementation(
					(username: string, systemId: EntityId | ObjectId): Promise<AccountDto> => {
						if (
							mockAccountWithLastFailedLogin.username === username &&
							mockAccountWithLastFailedLogin.systemId === systemId
						) {
							return Promise.resolve(AccountEntityToDtoMapper.mapToDto(mockAccountWithLastFailedLogin));
						}
						throw new EntityNotFoundError(Account.name);
					}
				);

				return { mockAccountWithLastFailedLogin };
			};

			it('should throw BruteForcePrevention', async () => {
				const { mockAccountWithLastFailedLogin } = setup();
				await expect(
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					accountUc.checkBrutForce(mockAccountWithLastFailedLogin.username, mockAccountWithLastFailedLogin.systemId!)
				).rejects.toThrow(BruteForcePrevention);
			});
		});

		describe('When the time difference > the allowed time', () => {
			const setup = () => {
				const mockAccountWithSystemId = accountFactory.withSystemId(new ObjectId(10)).build();

				// eslint-disable-next-line jest/unbound-method
				const updateMock = accountService.updateLastTriedFailedLogin as jest.Mock;

				configService.get.mockReturnValue(LOGIN_BLOCK_TIME);

				accountService.findByUsernameAndSystemId.mockImplementation(
					(username: string, systemId: EntityId | ObjectId): Promise<AccountDto> => {
						if (mockAccountWithSystemId.username === username && mockAccountWithSystemId.systemId === systemId) {
							return Promise.resolve(AccountEntityToDtoMapper.mapToDto(mockAccountWithSystemId));
						}
						throw new EntityNotFoundError(Account.name);
					}
				);

				return { mockAccountWithSystemId, updateMock };
			};

			it('should not throw Error, ', async () => {
				const { mockAccountWithSystemId, updateMock } = setup();

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
		});

		describe('When lasttriedFailedLogin is undefined', () => {
			const setup = () => {
				const mockAccountWithNoLastFailedLogin = accountFactory.buildWithId({
					userId: undefined,
					password: defaultPasswordHash,
					systemId: systemFactory.buildWithId().id,
					lasttriedFailedLogin: undefined,
				});

				configService.get.mockReturnValue(LOGIN_BLOCK_TIME);

				accountService.findByUsernameAndSystemId.mockImplementation(
					(username: string, systemId: EntityId | ObjectId): Promise<AccountDto> => {
						if (
							mockAccountWithNoLastFailedLogin.username === username &&
							mockAccountWithNoLastFailedLogin.systemId === systemId
						) {
							return Promise.resolve(AccountEntityToDtoMapper.mapToDto(mockAccountWithNoLastFailedLogin));
						}
						throw new EntityNotFoundError(Account.name);
					}
				);

				return { mockAccountWithNoLastFailedLogin };
			};
			it('should not throw error', async () => {
				const { mockAccountWithNoLastFailedLogin } = setup();
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
});
