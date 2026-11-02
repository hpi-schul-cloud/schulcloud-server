import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common/error';

import { faker } from '@faker-js/faker';
import { AuthorizationService } from '@modules/authorization';
import { RoleName } from '@modules/role';
import { Role } from '@modules/role/repo';
import { SchoolEntity } from '@modules/school/repo';
import { schoolEntityFactory } from '@modules/school/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { UnauthorizedException } from '@nestjs/common/exceptions/unauthorized.exception';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import { type Account, type AccountSave, AccountService } from '../domain';
import { AccountEntity, AccountEntityToDoMapper } from '../repo';
import { accountFactory } from '../testing';
import { AccountUc } from './account.uc';
import { type UpdateAccountDto } from './dto';

describe('AccountUc', () => {
	let module: TestingModule;
	let accountUc: AccountUc;

	let accountService: DeepMocked<AccountService>;
	let authorizationService: DeepMocked<AuthorizationService>;

	const defaultPassword = 'DummyPasswd!1';
	const defaultPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';

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
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		accountUc = module.get(AccountUc);
		accountService = module.get(AccountService);
		authorizationService = module.get(AuthorizationService);
		await setupEntities([AccountEntity, Role, SchoolEntity, User]);
	});

	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetAllMocks();
	});

	describe('updateMyAccount', () => {
		describe('When user does not exist', () => {
			const setup = () => {
				authorizationService.getUserWithPermissions.mockImplementation(() => {
					throw new EntityNotFoundError('User');
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
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockUserWithoutAccount = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.ADMINISTRATOR,
							permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
						}),
					],
				});

				accountService.findByUserIdOrFail.mockImplementation((): Promise<Account> => {
					throw new EntityNotFoundError('AccountEntity');
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

		describe('When changing own name is not allowed', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				authorizationService.getUserWithPermissions.mockResolvedValue(mockStudentUser);
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});
				accountService.findByUserIdOrFail.mockResolvedValue(AccountEntityToDoMapper.mapToDo(mockStudentAccount));
				accountService.validatePassword.mockResolvedValue(true);

				return { mockStudentUser };
			};
			it('should throw UnauthorizedException', async () => {
				const { mockStudentUser } = setup();
				await expect(
					accountUc.updateMyAccount(mockStudentUser.id, {
						passwordOld: defaultPassword,
						firstName: 'newFirstName',
					})
				).rejects.toThrow(UnauthorizedException);
				await expect(
					accountUc.updateMyAccount(mockStudentUser.id, {
						passwordOld: defaultPassword,
						lastName: 'newLastName',
					})
				).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('When using admin user', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

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

				authorizationService.getUserWithPermissions.mockResolvedValue(mockAdminUser);
				accountService.findByUserIdOrFail.mockResolvedValue(AccountEntityToDoMapper.mapToDo(mockAdminAccount));
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
				const mockSchool = schoolEntityFactory.buildWithId();

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

				authorizationService.getUserWithPermissions.mockResolvedValue(mockSuperheroUser);
				accountService.findByUserIdOrFail.mockResolvedValue(AccountEntityToDoMapper.mapToDo(mockSuperheroAccount));
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
	});

	describe('replaceMyTemporaryPassword', () => {
		describe('When replaceMyTemporaryPassword is called', () => {
			it('should call accountService.replaceMyTemporaryPassword', async () => {
				await accountUc.replaceMyTemporaryPassword('id', '', '');

				expect(accountService.replaceMyTemporaryPassword).toHaveBeenCalledTimes(1);
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

				const params: AccountSave = {
					username: 'john.doe@domain.tld',
					password: defaultPassword,
				} as AccountSave;
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
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				authorizationService.getUserWithPermissions.mockImplementation((): Promise<User> => {
					throw new EntityNotFoundError('User');
				});

				return { mockStudentAccount };
			};
			it('should throw EntityNotFoundError', async () => {
				const { mockStudentAccount } = setup();
				const currentUser = currentUserFactory.build({ userId: '00000000000' });
				const body = {} as UpdateAccountDto;
				await expect(accountUc.updateAccountById(currentUser, mockStudentAccount.id, body)).rejects.toThrow(
					EntityNotFoundError
				);
			});
		});

		describe('When target account does not exist', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

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

				const mockAccountWithoutUser = accountFactory.build({
					userId: undefined,
					password: defaultPasswordHash,
					systemId: faker.database.mongodbObjectId(),
				});

				authorizationService.getUserWithPermissions.mockResolvedValue(mockAdminUser);
				accountService.findById.mockResolvedValue(AccountEntityToDoMapper.mapToDo(mockAccountWithoutUser));

				return { mockAdminUser };
			};
			it('should throw EntityNotFoundError', async () => {
				const { mockAdminUser } = setup();
				const currentUser = currentUserFactory.build({ userId: mockAdminUser.id });
				const body = {} as UpdateAccountDto;
				await expect(accountUc.updateAccountById(currentUser, '000000000000000', body)).rejects.toThrow(
					EntityNotFoundError
				);
			});
		});

		describe('if target account has no user', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockSuperheroUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.SUPERHERO,
							permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
						}),
					],
				});
				const mockAccountWithoutUser = accountFactory.build({
					userId: undefined,
					password: defaultPasswordHash,
					systemId: faker.database.mongodbObjectId(),
				});

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(mockSuperheroUser);
				accountService.findById.mockResolvedValueOnce(AccountEntityToDoMapper.mapToDo(mockAccountWithoutUser));

				return { mockSuperheroUser, mockAccountWithoutUser };
			};

			it('should throw EntityNotFoundError', async () => {
				const { mockSuperheroUser, mockAccountWithoutUser } = setup();
				await expect(
					accountUc.updateAccountById(
						currentUserFactory.build({ userId: mockSuperheroUser.id }),
						mockAccountWithoutUser.id,
						{
							username: 'user-fail@to.update',
						}
					)
				).rejects.toThrow(EntityNotFoundError);
			});
		});

		describe('hasPermissionsToUpdateAccount', () => {
			describe('When using an admin user', () => {
				const setup = () => {
					const mockSchool = schoolEntityFactory.buildWithId();

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

					authorizationService.getUserWithPermissions
						.mockResolvedValueOnce(mockAdminUser)
						.mockResolvedValueOnce(mockTeacherUser);
					accountService.findById.mockResolvedValueOnce(AccountEntityToDoMapper.mapToDo(mockTeacherAccount));
					authorizationService.hasAllPermissions.mockReturnValue(true);

					return { mockAdminUser, mockTeacherAccount };
				};
				it('should not throw error when editing a teacher', async () => {
					const { mockAdminUser, mockTeacherAccount } = setup();
					const currentUser = currentUserFactory.build({ userId: mockAdminUser.id });
					const body = {} as UpdateAccountDto;
					await expect(accountUc.updateAccountById(currentUser, mockTeacherAccount.id, body)).resolves.not.toThrow();
				});
			});

			describe('When using a teacher user', () => {
				const setup = () => {
					const mockSchool = schoolEntityFactory.buildWithId();

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

					authorizationService.getUserWithPermissions
						.mockResolvedValueOnce(mockTeacherUser)
						.mockResolvedValueOnce(mockStudentUser);
					accountService.findById.mockResolvedValueOnce(AccountEntityToDoMapper.mapToDo(mockStudentAccount));
					accountService.updateAccount.mockResolvedValueOnce(AccountEntityToDoMapper.mapToDo(mockStudentAccount));
					authorizationService.hasAllPermissions.mockReturnValue(true);

					return { mockStudentAccount, mockTeacherUser };
				};
				it('should not throw error when editing a student', async () => {
					const { mockTeacherUser, mockStudentAccount } = setup();
					const currentUser = currentUserFactory.build({ userId: mockTeacherUser.id });
					const body = {} as UpdateAccountDto;
					await expect(accountUc.updateAccountById(currentUser, mockStudentAccount.id, body)).resolves.not.toThrow();
				});
			});
			describe('When using an admin user', () => {
				const setup = () => {
					const mockSchool = schoolEntityFactory.buildWithId();

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

					authorizationService.getUserWithPermissions
						.mockResolvedValueOnce(mockAdminUser)
						.mockResolvedValueOnce(mockStudentUser);
					accountService.findById.mockResolvedValueOnce(AccountEntityToDoMapper.mapToDo(mockStudentAccount));
					accountService.updateAccount.mockResolvedValueOnce(AccountEntityToDoMapper.mapToDo(mockStudentAccount));
					authorizationService.hasAllPermissions.mockReturnValue(true);

					return { mockStudentAccount, mockAdminUser };
				};
				it('should not throw error when editing a student', async () => {
					const { mockAdminUser, mockStudentAccount } = setup();
					const currentUser = currentUserFactory.build({ userId: mockAdminUser.id });
					const body = {} as UpdateAccountDto;
					await expect(accountUc.updateAccountById(currentUser, mockStudentAccount.id, body)).resolves.not.toThrow();
				});
			});

			describe('When using a teacher user to edit another teacher', () => {
				const setup = () => {
					const mockSchool = schoolEntityFactory.buildWithId();

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

					authorizationService.getUserWithPermissions
						.mockResolvedValueOnce(mockTeacherUser)
						.mockResolvedValueOnce(mockOtherTeacherUser);
					accountService.findById.mockResolvedValueOnce(AccountEntityToDoMapper.mapToDo(mockOtherTeacherAccount));

					return { mockOtherTeacherAccount, mockTeacherUser };
				};
				it('should throw UnauthorizedException', async () => {
					const { mockTeacherUser, mockOtherTeacherAccount } = setup();
					const currentUser = currentUserFactory.build({ userId: mockTeacherUser.id });
					const body = {} as UpdateAccountDto;
					await expect(accountUc.updateAccountById(currentUser, mockOtherTeacherAccount.id, body)).rejects.toThrow(
						UnauthorizedException
					);
				});
			});

			describe('When using an admin user of other school', () => {
				const setup = () => {
					const mockSchool = schoolEntityFactory.buildWithId();
					const mockOtherSchool = schoolEntityFactory.buildWithId();

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

					authorizationService.getUserWithPermissions
						.mockResolvedValueOnce(mockDifferentSchoolAdminUser)
						.mockResolvedValueOnce(mockTeacherUser);
					accountService.findById.mockResolvedValueOnce(AccountEntityToDoMapper.mapToDo(mockTeacherAccount));

					return { mockDifferentSchoolAdminUser, mockTeacherAccount };
				};
				it('should throw UnauthorizedException', async () => {
					const { mockDifferentSchoolAdminUser, mockTeacherAccount } = setup();
					const currentUser = currentUserFactory.build({ userId: mockDifferentSchoolAdminUser.id });
					const body = {} as UpdateAccountDto;
					await expect(accountUc.updateAccountById(currentUser, mockTeacherAccount.id, body)).rejects.toThrow(
						UnauthorizedException
					);
				});
			});

			describe('When using a superhero user', () => {
				const setup = () => {
					const mockSchool = schoolEntityFactory.buildWithId();

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

					authorizationService.getUserWithPermissions
						.mockResolvedValueOnce(mockSuperheroUser)
						.mockResolvedValueOnce(mockAdminUser);
					accountService.findById.mockResolvedValueOnce(AccountEntityToDoMapper.mapToDo(mockAdminAccount));
					accountService.updateAccount.mockResolvedValueOnce(AccountEntityToDoMapper.mapToDo(mockAdminAccount));
					authorizationService.hasAllPermissions.mockReturnValue(true);

					return { mockAdminAccount, mockSuperheroUser };
				};
				it('should not throw error when editing a admin', async () => {
					const { mockSuperheroUser, mockAdminAccount } = setup();
					const currentUser = currentUserFactory.build({ userId: mockSuperheroUser.id });
					const body = {} as UpdateAccountDto;
					await expect(accountUc.updateAccountById(currentUser, mockAdminAccount.id, body)).resolves.not.toThrow();
				});
			});

			describe('When using an user with undefined role', () => {
				const setup = () => {
					const mockSchool = schoolEntityFactory.buildWithId();

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

					authorizationService.getUserWithPermissions
						.mockResolvedValueOnce(mockUnknownRoleUser)
						.mockResolvedValueOnce(mockUserWithoutRole);
					accountService.findById.mockResolvedValueOnce(AccountEntityToDoMapper.mapToDo(mockAccountWithoutRole));

					return { mockAccountWithoutRole, mockUnknownRoleUser };
				};
				it('should fail by default', async () => {
					const { mockUnknownRoleUser, mockAccountWithoutRole } = setup();
					const currentUser = currentUserFactory.build({ userId: mockUnknownRoleUser.id });
					const body = {} as UpdateAccountDto;
					await expect(accountUc.updateAccountById(currentUser, mockAccountWithoutRole.id, body)).rejects.toThrow(
						UnauthorizedException
					);
				});
			});

			describe('When editing an user without role', () => {
				const setup = () => {
					const mockSchool = schoolEntityFactory.buildWithId();

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

					authorizationService.getUserWithPermissions
						.mockResolvedValueOnce(mockAdminUser)
						.mockResolvedValueOnce(mockUnknownRoleUser);
					accountService.findById.mockResolvedValueOnce(AccountEntityToDoMapper.mapToDo(mockUnknownRoleUserAccount));

					return { mockAdminUser, mockUnknownRoleUserAccount };
				};
				it('should throw UnauthorizedException', async () => {
					const { mockAdminUser, mockUnknownRoleUserAccount } = setup();
					const currentUser = currentUserFactory.build({ userId: mockAdminUser.id });
					const body = {} as UpdateAccountDto;
					await expect(accountUc.updateAccountById(currentUser, mockUnknownRoleUserAccount.id, body)).rejects.toThrow(
						UnauthorizedException
					);
				});
			});
		});
	});
});
