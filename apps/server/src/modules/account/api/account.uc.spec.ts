import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ICurrentUser } from '@modules/authentication';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';

import { faker } from '@faker-js/faker';
import { AuthorizationService } from '@modules/authorization';
import { UnauthorizedException } from '@nestjs/common/exceptions/unauthorized.exception';
import { Role, User } from '@shared/domain/entity';
import { Permission, RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { schoolEntityFactory, setupEntities, userFactory } from '@shared/testing';
import { Account, AccountSave } from '../domain';
import { AccountEntity } from '../domain/entity/account.entity';
import { AccountService } from '../domain/services';
import { AccountEntityToDoMapper } from '../repo/micro-orm/mapper';
import { AccountUc } from './account.uc';
import { AccountSearchDto, AccountSearchType, UpdateAccountDto } from './dto';
import { ResolvedAccountDto, ResolvedSearchListAccountDto } from './dto/resolved-account.dto';
import { accountFactory } from '../testing';

describe('AccountUc', () => {
	let module: TestingModule;
	let accountUc: AccountUc;

	let accountService: DeepMocked<AccountService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let configService: DeepMocked<ConfigService>;

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
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
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
				authorizationService.getUserWithPermissions.mockImplementation(() => {
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
					throw new EntityNotFoundError(AccountEntity.name);
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

				expect(accountService.replaceMyTemporaryPassword).toBeCalledTimes(1);
			});
		});
	});

	describe('searchAccounts', () => {
		describe('When search type is userId', () => {
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
				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});

				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				authorizationService.getUserWithPermissions
					.mockResolvedValueOnce(mockSuperheroUser)
					.mockResolvedValueOnce(mockStudentUser);
				accountService.findByUserId.mockResolvedValueOnce(AccountEntityToDoMapper.mapToDo(mockStudentAccount));

				return { mockSuperheroUser, mockStudentUser, mockStudentAccount };
			};
			it('should return one account', async () => {
				const { mockSuperheroUser, mockStudentUser, mockStudentAccount } = setup();
				const accounts = await accountUc.searchAccounts(
					{ userId: mockSuperheroUser.id } as ICurrentUser,
					{ type: AccountSearchType.USER_ID, value: mockStudentUser.id } as AccountSearchDto
				);
				const expected = new ResolvedSearchListAccountDto(
					[
						new ResolvedAccountDto({
							id: mockStudentAccount.id,
							userId: mockStudentAccount.userId?.toString(),
							activated: mockStudentAccount.activated,
							username: mockStudentAccount.username,
							updatedAt: mockStudentAccount.updatedAt,
							password: mockStudentAccount.password,
							createdAt: mockStudentAccount.createdAt,
							systemId: mockStudentAccount.systemId?.toString(),
						}),
					],
					1,
					0,
					1
				);
				expect(accounts).toStrictEqual<ResolvedSearchListAccountDto>(expected);
			});
		});

		describe('When account is not found', () => {
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
				const mockUserWithoutAccount = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.ADMINISTRATOR,
							permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
						}),
					],
				});

				authorizationService.getUserWithPermissions
					.mockResolvedValueOnce(mockSuperheroUser)
					.mockResolvedValueOnce(mockUserWithoutAccount);
				authorizationService.hasAllPermissions.mockReturnValue(true);
				accountService.findByUserId.mockResolvedValueOnce(null);

				return { mockSuperheroUser, mockUserWithoutAccount };
			};
			it('should return empty list', async () => {
				const { mockSuperheroUser, mockUserWithoutAccount } = setup();
				const accounts = await accountUc.searchAccounts(
					{ userId: mockSuperheroUser.id } as ICurrentUser,
					{ type: AccountSearchType.USER_ID, value: mockUserWithoutAccount.id } as AccountSearchDto
				);
				const expected = new ResolvedSearchListAccountDto([], 0, 0, 0);
				expect(accounts).toStrictEqual<ResolvedSearchListAccountDto>(expected);
			});
		});
		describe('When search type is username', () => {
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
				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});

				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				authorizationService.getUserWithPermissions
					.mockResolvedValueOnce(mockSuperheroUser)
					.mockResolvedValueOnce(mockSuperheroUser);
				accountService.searchByUsernamePartialMatch.mockResolvedValueOnce([
					[AccountEntityToDoMapper.mapToDo(mockStudentAccount), AccountEntityToDoMapper.mapToDo(mockStudentAccount)],
					2,
				]);

				return { mockSuperheroUser };
			};
			it('should return one or more accounts, ', async () => {
				const { mockSuperheroUser } = setup();
				const accounts = await accountUc.searchAccounts(
					{ userId: mockSuperheroUser.id } as ICurrentUser,
					{ type: AccountSearchType.USERNAME, value: '' } as AccountSearchDto
				);
				expect(accounts.skip).toEqual(0);
				expect(accounts.limit).toEqual(10);
				expect(accounts.total).toBeGreaterThan(1);
				expect(accounts.data.length).toBeGreaterThan(1);
			});
		});

		describe('When user has not the right permissions', () => {
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
				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockOtherStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});

				authorizationService.getUserWithPermissions
					.mockResolvedValueOnce(mockTeacherUser)
					.mockResolvedValueOnce(mockAdminUser);
				authorizationService.getUserWithPermissions
					.mockResolvedValueOnce(mockStudentUser)
					.mockResolvedValueOnce(mockOtherStudentUser);
				authorizationService.getUserWithPermissions
					.mockResolvedValueOnce(mockStudentUser)
					.mockResolvedValueOnce(mockTeacherUser);
				authorizationService.hasAllPermissions.mockReturnValue(false);

				return { mockTeacherUser, mockAdminUser, mockStudentUser, mockOtherStudentUser };
			};
			it('should throw UnauthorizedException', async () => {
				const { mockTeacherUser, mockAdminUser, mockStudentUser, mockOtherStudentUser } = setup();
				await expect(
					accountUc.searchAccounts(
						{ userId: mockTeacherUser.id } as ICurrentUser,
						{ type: AccountSearchType.USER_ID, value: mockAdminUser.id } as AccountSearchDto
					)
				).rejects.toThrow(UnauthorizedException);

				await expect(
					accountUc.searchAccounts(
						{ userId: mockStudentUser.id } as ICurrentUser,
						{ type: AccountSearchType.USER_ID, value: mockOtherStudentUser.id } as AccountSearchDto
					)
				).rejects.toThrow(UnauthorizedException);

				await expect(
					accountUc.searchAccounts(
						{ userId: mockStudentUser.id } as ICurrentUser,
						{ type: AccountSearchType.USER_ID, value: mockTeacherUser.id } as AccountSearchDto
					)
				).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('When search type is unknown', () => {
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

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(mockSuperheroUser);

				return { mockSuperheroUser };
			};
			it('should throw Invalid search type', async () => {
				const { mockSuperheroUser } = setup();
				await expect(
					accountUc.searchAccounts(
						{ userId: mockSuperheroUser.id } as ICurrentUser,
						{ type: '' as AccountSearchType } as AccountSearchDto
					)
				).rejects.toThrow('Invalid search type.');
			});
		});

		describe('When user does not have view permission', () => {
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

				authorizationService.getUserWithPermissions
					.mockResolvedValueOnce(mockTeacherUser)
					.mockResolvedValueOnce(mockStudentUser);
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				return { mockStudentUser, mockTeacherUser };
			};
			it('should throw UnauthorizedException', async () => {
				const { mockTeacherUser, mockStudentUser } = setup();
				await expect(
					accountUc.searchAccounts(
						{ userId: mockTeacherUser.id } as ICurrentUser,
						{ type: AccountSearchType.USERNAME, value: mockStudentUser.id } as AccountSearchDto
					)
				).rejects.toThrow(UnauthorizedException);
			});
		});
		describe('hasPermissionsToAccessAccount', () => {
			describe('When using an admin', () => {
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

					configService.get.mockReturnValue(false);
					authorizationService.getUserWithPermissions
						.mockResolvedValueOnce(mockAdminUser)
						.mockResolvedValueOnce(mockTeacherUser);
					authorizationService.hasAllPermissions.mockReturnValue(true);

					return { mockAdminUser, mockTeacherUser };
				};
				it('should be able to access teacher of the same school via user id', async () => {
					const { mockAdminUser, mockTeacherUser } = setup();
					const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
					const params = { type: AccountSearchType.USER_ID, value: mockTeacherUser.id } as AccountSearchDto;
					await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();
				});
			});

			describe('When using an admin', () => {
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

					configService.get.mockReturnValue(false);
					authorizationService.getUserWithPermissions
						.mockResolvedValueOnce(mockAdminUser)
						.mockResolvedValueOnce(mockStudentUser);
					authorizationService.hasAllPermissions.mockReturnValue(true);

					return { mockAdminUser, mockStudentUser };
				};
				it('should be able to access student of the same school via user id', async () => {
					const { mockAdminUser, mockStudentUser } = setup();
					const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
					const params = { type: AccountSearchType.USER_ID, value: mockStudentUser.id } as AccountSearchDto;
					await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();
				});
			});

			describe('When using an admin', () => {
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

					configService.get.mockReturnValue(false);
					authorizationService.getUserWithPermissions
						.mockResolvedValueOnce(mockAdminUser)
						.mockResolvedValueOnce(mockAdminUser);

					return { mockAdminUser };
				};

				it('should not be able to access admin of the same school via user id', async () => {
					const { mockAdminUser } = setup();
					const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
					const params = { type: AccountSearchType.USER_ID, value: mockAdminUser.id } as AccountSearchDto;
					await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();
				});
			});

			describe('When using an admin', () => {
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
					const mockStudentUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
					});
					const mockDifferentSchoolAdminUser = userFactory.buildWithId({
						school: mockOtherSchool,
						roles: [...mockAdminUser.roles],
					});

					configService.get.mockReturnValue(false);
					authorizationService.getUserWithPermissions
						.mockResolvedValueOnce(mockDifferentSchoolAdminUser)
						.mockResolvedValueOnce(mockTeacherUser);
					authorizationService.getUserWithPermissions
						.mockResolvedValueOnce(mockDifferentSchoolAdminUser)
						.mockResolvedValueOnce(mockStudentUser);

					return { mockDifferentSchoolAdminUser, mockTeacherUser, mockStudentUser };
				};
				it('should not be able to access any account of a foreign school via user id', async () => {
					const { mockDifferentSchoolAdminUser, mockTeacherUser, mockStudentUser } = setup();
					const currentUser = { userId: mockDifferentSchoolAdminUser.id } as ICurrentUser;

					let params = { type: AccountSearchType.USER_ID, value: mockTeacherUser.id } as AccountSearchDto;
					await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();

					params = { type: AccountSearchType.USER_ID, value: mockStudentUser.id } as AccountSearchDto;
					await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();
				});
			});

			describe('When using a teacher', () => {
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

					configService.get.mockReturnValue(false);
					authorizationService.getUserWithPermissions
						.mockResolvedValueOnce(mockTeacherUser)
						.mockResolvedValueOnce(mockOtherTeacherUser);
					authorizationService.hasAllPermissions.mockReturnValue(true);

					return { mockTeacherUser, mockOtherTeacherUser };
				};
				it('should be able to access teacher of the same school via user id', async () => {
					const { mockTeacherUser, mockOtherTeacherUser } = setup();
					const currentUser = { userId: mockTeacherUser.id } as ICurrentUser;
					const params = {
						type: AccountSearchType.USER_ID,
						value: mockOtherTeacherUser.id,
					} as AccountSearchDto;
					await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();
				});
			});

			describe('When using a teacher', () => {
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

					configService.get.mockReturnValue(false);
					authorizationService.getUserWithPermissions
						.mockResolvedValueOnce(mockTeacherUser)
						.mockResolvedValueOnce(mockStudentUser);
					authorizationService.hasAllPermissions.mockReturnValue(true);

					return { mockTeacherUser, mockStudentUser };
				};
				it('should be able to access student of the same school via user id', async () => {
					const { mockTeacherUser, mockStudentUser } = setup();
					const currentUser = { userId: mockTeacherUser.id } as ICurrentUser;
					const params = { type: AccountSearchType.USER_ID, value: mockStudentUser.id } as AccountSearchDto;
					await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();
				});
			});

			describe('When using a teacher', () => {
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

					configService.get.mockReturnValue(false);
					authorizationService.getUserWithPermissions
						.mockResolvedValueOnce(mockTeacherUser)
						.mockResolvedValueOnce(mockAdminUser);

					return { mockTeacherUser, mockAdminUser };
				};
				it('should not be able to access admin of the same school via user id', async () => {
					const { mockTeacherUser, mockAdminUser } = setup();
					const currentUser = { userId: mockTeacherUser.id } as ICurrentUser;
					const params = { type: AccountSearchType.USER_ID, value: mockAdminUser.id } as AccountSearchDto;
					await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();
				});
			});

			describe('When using a teacher', () => {
				const setup = () => {
					const mockSchool = schoolEntityFactory.buildWithId();
					const mockOtherSchool = schoolEntityFactory.buildWithId();

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
					authorizationService.getUserWithPermissions
						.mockResolvedValueOnce(mockDifferentSchoolTeacherUser)
						.mockResolvedValueOnce(mockTeacherUser);
					authorizationService.getUserWithPermissions
						.mockResolvedValueOnce(mockDifferentSchoolTeacherUser)
						.mockResolvedValueOnce(mockStudentUser);

					return { mockDifferentSchoolTeacherUser, mockTeacherUser, mockStudentUser };
				};
				it('should not be able to access any account of a foreign school via user id', async () => {
					const { mockDifferentSchoolTeacherUser, mockTeacherUser, mockStudentUser } = setup();
					const currentUser = { userId: mockDifferentSchoolTeacherUser.id } as ICurrentUser;

					let params = { type: AccountSearchType.USER_ID, value: mockTeacherUser.id } as AccountSearchDto;
					await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();

					params = { type: AccountSearchType.USER_ID, value: mockStudentUser.id } as AccountSearchDto;
					await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();
				});
			});
			describe('When using a teacher', () => {
				const setup = () => {
					const mockSchoolWithStudentVisibility = schoolEntityFactory.buildWithId({
						permissions: {
							teacher: {
								STUDENT_LIST: true,
							},
						},
					});

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
					authorizationService.getUserWithPermissions
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
					} as AccountSearchDto;
					await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();
				});
			});

			describe('When using a teacher', () => {
				const setup = () => {
					const mockSchool = schoolEntityFactory.buildWithId();

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
					authorizationService.getUserWithPermissions
						.mockResolvedValueOnce(mockTeacherNoUserNoSchoolPermissionUser)
						.mockResolvedValueOnce(mockStudentUser);

					return { mockTeacherNoUserNoSchoolPermissionUser, mockStudentUser };
				};
				it('should not be able to access student of the same school if school has no global permission', async () => {
					const { mockTeacherNoUserNoSchoolPermissionUser, mockStudentUser } = setup();
					configService.get.mockReturnValue(true);
					const currentUser = { userId: mockTeacherNoUserNoSchoolPermissionUser.id } as ICurrentUser;
					const params = { type: AccountSearchType.USER_ID, value: mockStudentUser.id } as AccountSearchDto;
					await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow(UnauthorizedException);
				});
			});

			describe('When using a student', () => {
				const setup = () => {
					const mockSchoolWithStudentVisibility = schoolEntityFactory.buildWithId({
						permissions: {
							teacher: {
								STUDENT_LIST: true,
							},
						},
					});

					const mockStudentSchoolPermissionUser = userFactory.buildWithId({
						school: mockSchoolWithStudentVisibility,
						roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
					});
					const mockOtherStudentSchoolPermissionUser = userFactory.buildWithId({
						school: mockSchoolWithStudentVisibility,
						roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
					});

					configService.get.mockReturnValue(false);
					authorizationService.getUserWithPermissions
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
					} as AccountSearchDto;
					await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow(UnauthorizedException);
				});
			});

			describe('When using a student', () => {
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
					const mockStudentUser = userFactory.buildWithId({
						school: mockSchool,
						roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
					});

					configService.get.mockReturnValue(false);
					authorizationService.getUserWithPermissions
						.mockResolvedValueOnce(mockStudentUser)
						.mockResolvedValueOnce(mockAdminUser);
					authorizationService.getUserWithPermissions
						.mockResolvedValueOnce(mockStudentUser)
						.mockResolvedValueOnce(mockTeacherUser);
					authorizationService.getUserWithPermissions
						.mockResolvedValueOnce(mockStudentUser)
						.mockResolvedValueOnce(mockStudentUser);

					return { mockStudentUser, mockAdminUser, mockTeacherUser };
				};
				it('should not be able to access any other account via user id', async () => {
					const { mockStudentUser, mockAdminUser, mockTeacherUser } = setup();
					const currentUser = { userId: mockStudentUser.id } as ICurrentUser;

					let params = { type: AccountSearchType.USER_ID, value: mockAdminUser.id } as AccountSearchDto;
					await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();

					params = { type: AccountSearchType.USER_ID, value: mockTeacherUser.id } as AccountSearchDto;
					await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();

					params = { type: AccountSearchType.USER_ID, value: mockStudentUser.id } as AccountSearchDto;
					await expect(accountUc.searchAccounts(currentUser, params)).rejects.toThrow();
				});
			});

			describe('When using a superhero', () => {
				const setup = () => {
					const mockSchool = schoolEntityFactory.buildWithId();
					const mockOtherSchool = schoolEntityFactory.buildWithId();

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
					authorizationService.getUserWithPermissions.mockResolvedValue(mockSuperheroUser);
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
					} as AccountSearchDto;
					await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();

					params = { type: AccountSearchType.USERNAME, value: mockTeacherAccount.username } as AccountSearchDto;
					await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();

					params = { type: AccountSearchType.USERNAME, value: mockStudentAccount.username } as AccountSearchDto;
					await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();

					params = {
						type: AccountSearchType.USERNAME,
						value: mockDifferentSchoolAdminAccount.username,
					} as AccountSearchDto;
					await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();

					params = {
						type: AccountSearchType.USERNAME,
						value: mockDifferentSchoolTeacherAccount.username,
					} as AccountSearchDto;
					await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();

					params = {
						type: AccountSearchType.USERNAME,
						value: mockDifferentSchoolStudentAccount.username,
					} as AccountSearchDto;
					await expect(accountUc.searchAccounts(currentUser, params)).resolves.not.toThrow();
				});
			});
		});
	});

	describe('findAccountById', () => {
		describe('When the current user is a superhero', () => {
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
				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(mockSuperheroUser);
				accountService.findById.mockResolvedValueOnce(AccountEntityToDoMapper.mapToDo(mockStudentAccount));

				return { mockSuperheroUser, mockStudentUser, mockStudentAccount };
			};
			it('should return an account', async () => {
				const { mockSuperheroUser, mockStudentUser, mockStudentAccount } = setup();
				const account = await accountUc.findAccountById(
					{ userId: mockSuperheroUser.id } as ICurrentUser,
					mockStudentAccount.id
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

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(mockTeacherUser);
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				return { mockTeacherUser, mockStudentAccount };
			};
			it('should throw UnauthorizedException', async () => {
				const { mockTeacherUser, mockStudentAccount } = setup();
				await expect(
					accountUc.findAccountById({ userId: mockTeacherUser.id } as ICurrentUser, mockStudentAccount.id)
				).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('When no account matches the search term', () => {
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

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(mockSuperheroUser);
				accountService.findById.mockImplementation((): Promise<Account> => {
					throw new EntityNotFoundError(AccountEntity.name);
				});

				return { mockSuperheroUser };
			};
			it('should throw EntityNotFoundError', async () => {
				const { mockSuperheroUser } = setup();
				await expect(
					accountUc.findAccountById({ userId: mockSuperheroUser.id } as ICurrentUser, 'xxx')
				).rejects.toThrow(EntityNotFoundError);
			});
		});

		describe('When target account has no user', () => {
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

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(mockSuperheroUser);
				accountService.findById.mockImplementation((): Promise<Account> => {
					throw new EntityNotFoundError(AccountEntity.name);
				});

				return { mockSuperheroUser };
			};
			it('should throw EntityNotFoundError', async () => {
				const { mockSuperheroUser } = setup();
				await expect(
					accountUc.findAccountById({ userId: mockSuperheroUser.id } as ICurrentUser, 'xxx')
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
					throw new EntityNotFoundError(User.name);
				});

				return { mockStudentAccount };
			};
			it('should throw EntityNotFoundError', async () => {
				const { mockStudentAccount } = setup();
				const currentUser = { userId: '000000000000000' } as ICurrentUser;
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
				const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
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
					accountUc.updateAccountById({ userId: mockSuperheroUser.id } as ICurrentUser, mockAccountWithoutUser.id, {
						username: 'user-fail@to.update',
					} as UpdateAccountDto)
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
					const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
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
					const currentUser = { userId: mockTeacherUser.id } as ICurrentUser;
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
					const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
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
					const currentUser = { userId: mockTeacherUser.id } as ICurrentUser;
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
					const currentUser = { userId: mockDifferentSchoolAdminUser.id } as ICurrentUser;
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
					const currentUser = { userId: mockSuperheroUser.id } as ICurrentUser;
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
					const currentUser = { userId: mockUnknownRoleUser.id } as ICurrentUser;
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
					const currentUser = { userId: mockAdminUser.id } as ICurrentUser;
					const body = {} as UpdateAccountDto;
					await expect(accountUc.updateAccountById(currentUser, mockUnknownRoleUserAccount.id, body)).rejects.toThrow(
						UnauthorizedException
					);
				});
			});
		});
	});

	describe('deleteAccountById', () => {
		describe('When current user has the delete permission', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockSuperheroUser = userFactory.buildWithId({
					school: mockSchool,
					roles: [
						new Role({
							name: RoleName.SUPERHERO,
							permissions: [Permission.ACCOUNT_DELETE],
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

				authorizationService.getUserWithPermissions.mockResolvedValue(mockSuperheroUser);
				accountService.findById.mockResolvedValue(AccountEntityToDoMapper.mapToDo(mockStudentAccount));

				return { mockSuperheroUser, mockStudentAccount };
			};
			it('should delete an account', async () => {
				const { mockSuperheroUser, mockStudentAccount } = setup();
				await expect(
					accountUc.deleteAccountById({ userId: mockSuperheroUser.id } as ICurrentUser, mockStudentAccount.id)
				).resolves.not.toThrow();
			});
		});

		describe('When the current user does not have the delete permission', () => {
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

				authorizationService.getUserWithPermissions.mockImplementation((userId: EntityId): Promise<User> => {
					if (mockAdminUser.id === userId) {
						return Promise.resolve(mockAdminUser);
					}
					throw new EntityNotFoundError(User.name);
				});
				authorizationService.checkAllPermissions.mockImplementation((): boolean => {
					throw new UnauthorizedException();
				});

				return { mockAdminUser, mockStudentAccount };
			};
			it('should throw UnauthorizedException', async () => {
				const { mockAdminUser, mockStudentAccount } = setup();
				await expect(
					accountUc.deleteAccountById({ userId: mockAdminUser.id } as ICurrentUser, mockStudentAccount.id)
				).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('When no account matches the search term', () => {
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

				authorizationService.getUserWithPermissions.mockImplementation((userId: EntityId): Promise<User> => {
					if (mockSuperheroUser.id === userId) {
						return Promise.resolve(mockSuperheroUser);
					}
					throw new EntityNotFoundError(User.name);
				});

				accountService.findById.mockImplementation((id: EntityId): Promise<Account> => {
					if (id === 'xxx') {
						throw new EntityNotFoundError(AccountEntity.name);
					}
					return Promise.reject();
				});

				return { mockSuperheroUser };
			};
			it('should throw, if no account matches the search term', async () => {
				const { mockSuperheroUser } = setup();
				await expect(
					accountUc.deleteAccountById({ userId: mockSuperheroUser.id } as ICurrentUser, 'xxx')
				).rejects.toThrow(EntityNotFoundError);
			});
		});
	});
});
