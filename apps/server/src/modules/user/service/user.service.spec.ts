import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { AccountService } from '@modules/account';
import { OauthCurrentUser } from '@modules/authentication/interface';
import { RoleService } from '@modules/role';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { EntityId } from '@shared/domain/types';
import { Role, User } from '@shared/domain/entity';
import { IFindOptions, LanguageType, Permission, RoleName, SortOrder } from '@shared/domain/interface';
import { UserRepo } from '@shared/repo';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { roleFactory, setupEntities, userDoFactory, userFactory } from '@shared/testing';
import { Account } from '@modules/account/domain';
import { Logger } from '@src/core/logger';
import { EventBus } from '@nestjs/cqrs';
import { RegistrationPinService } from '@modules/registration-pin';
import {
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	DataDeletedEvent,
	DeletionErrorLoggableException,
} from '@modules/deletion';
import { deletionRequestFactory } from '@modules/deletion/domain/testing';
import { UserService } from './user.service';
import { UserQuery } from './user-query.type';
import { UserDto } from '../uc/dto/user.dto';

describe('UserService', () => {
	let service: UserService;
	let module: TestingModule;

	let userRepo: DeepMocked<UserRepo>;
	let userDORepo: DeepMocked<UserDORepo>;
	let config: DeepMocked<ConfigService>;
	let roleService: DeepMocked<RoleService>;
	let accountService: DeepMocked<AccountService>;
	let registrationPinService: DeepMocked<RegistrationPinService>;
	let eventBus: DeepMocked<EventBus>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserService,
				{
					provide: EntityManager,
					useValue: createMock<EntityManager>(),
				},
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: UserDORepo,
					useValue: createMock<UserDORepo>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
				{
					provide: RoleService,
					useValue: createMock<RoleService>(),
				},
				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
				},
				{
					provide: RegistrationPinService,
					useValue: createMock<RegistrationPinService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: EventBus,
					useValue: {
						publish: jest.fn(),
					},
				},
			],
		}).compile();
		service = module.get(UserService);

		userRepo = module.get(UserRepo);
		userDORepo = module.get(UserDORepo);
		config = module.get(ConfigService);
		roleService = module.get(RoleService);
		accountService = module.get(AccountService);
		registrationPinService = module.get(RegistrationPinService);
		eventBus = module.get(EventBus);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('me', () => {
		it('should return an array with the user and its permissions', async () => {
			const permission = Permission.ACCOUNT_CREATE;
			const role = roleFactory.build({ permissions: [permission] });
			const user = userFactory.buildWithId({ roles: [role] });
			userRepo.findById.mockResolvedValue(user);
			const userSpy = jest.spyOn(user, 'resolvePermissions').mockReturnValueOnce([permission]);

			const result = await service.me(user.id);

			expect(result[0]).toEqual(user);
			expect(result[1]).toEqual([permission]);

			userSpy.mockRestore();
		});
	});

	describe('getUserEntityWithRoles', () => {
		describe('when user with roles exists', () => {
			const setup = () => {
				const roles = roleFactory.buildListWithId(2);
				const user = userFactory.buildWithId({ roles });

				userRepo.findById.mockResolvedValueOnce(user);

				return { user, userId: user.id };
			};

			it('should return the user with included roles', async () => {
				const { user, userId } = setup();

				const result = await service.getUserEntityWithRoles(userId);

				expect(result).toEqual(user);
				expect(result.getRoles()).toHaveLength(2);
			});
		});

		describe('when repo throws an error', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const error = new NotFoundException();

				userRepo.findById.mockRejectedValueOnce(error);

				return { userId, error };
			};

			it('should throw an error', async () => {
				const { userId, error } = setup();

				await expect(() => service.getUserEntityWithRoles(userId)).rejects.toThrowError(error);
			});
		});
	});

	describe('getUser', () => {
		let user: User;

		beforeEach(() => {
			user = userFactory.buildWithId({ roles: [] });
			userRepo.findById.mockResolvedValue(user);
		});

		it('should provide information about the passed userId', async () => {
			// Act
			const userDto: UserDto = await service.getUser(user.id);

			// Assert
			expect(userDto).toBeDefined();
			expect(userDto).toBeInstanceOf(UserDto);
			expect(userRepo.findById).toHaveBeenCalled();
		});
	});

	describe('findById', () => {
		beforeEach(() => {
			const userDO: UserDO = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.STUDENT }]).build({
				firstName: 'firstName',
				lastName: 'lastName',
				email: 'email',
				schoolId: 'schoolId',
				externalId: 'externalUserId',
			});
			userDORepo.findById.mockResolvedValue(userDO);
		});

		it('should provide the userDO', async () => {
			const result: UserDO = await service.findById('id');

			expect(result).toBeDefined();
			expect(result).toBeInstanceOf(UserDO);
		});
	});

	describe('findByIdOrNull', () => {
		describe('when a user with this id exists', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const user: UserDO = userDoFactory.buildWithId({ id: userId });

				userDORepo.findByIdOrNull.mockResolvedValue(user);

				return {
					user,
					userId,
				};
			};

			it('should return the user', async () => {
				const { user, userId } = setup();

				const result: UserDO | null = await service.findByIdOrNull(userId);

				expect(result).toEqual(user);
			});
		});

		describe('when a user with this id does not exist', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();

				userDORepo.findByIdOrNull.mockResolvedValue(null);

				return { userId };
			};

			it('should return null', async () => {
				const { userId } = setup();

				const result: UserDO | null = await service.findByIdOrNull(userId);

				expect(result).toBeNull();
			});
		});
	});

	describe('getResolvedUser is called', () => {
		describe('when a resolved user is requested', () => {
			const setup = () => {
				const systemId = 'systemId';
				const role: Role = roleFactory.buildWithId({
					name: RoleName.STUDENT,
					permissions: [Permission.DASHBOARD_VIEW],
				});
				const user: UserDO = userDoFactory.buildWithId({ roles: [role] });
				const account: Account = new Account({
					id: 'accountId',
					systemId,
					username: 'username',
					createdAt: new Date(),
					updatedAt: new Date(),
					activated: true,
				});

				userDORepo.findById.mockResolvedValue(user);
				accountService.findByUserIdOrFail.mockResolvedValue(account);

				return {
					userId: user.id as string,
					user,
					account,
					role,
					systemId,
				};
			};

			it('should return the current user', async () => {
				const { userId, user, account, role, systemId } = setup();

				const result: OauthCurrentUser = await service.getResolvedUser(userId);

				expect(result).toEqual<OauthCurrentUser>({
					userId,
					systemId,
					schoolId: user.schoolId,
					accountId: account.id,
					roles: [role.id],
					isExternalUser: true,
				});
			});
		});
	});

	describe('getDisplayName', () => {
		let role: Role;

		beforeEach(() => {
			role = roleFactory.buildWithId();
			roleService.getProtectedRoles.mockResolvedValue([role]);
		});

		it('should return only the last name when the user has a protected role', async () => {
			const user: UserDO = userDoFactory.withRoles([{ id: role.id, name: RoleName.STUDENT }]).buildWithId({
				lastName: 'lastName',
			});

			const result: string = await service.getDisplayName(user);

			expect(result).toEqual(user.lastName);
			expect(roleService.getProtectedRoles).toHaveBeenCalled();
		});

		it('should return the first name and last name when the user has no protected role', async () => {
			const user: UserDO = userDoFactory.withRoles([{ id: 'unprotectedId', name: RoleName.STUDENT }]).buildWithId({
				lastName: 'lastName',
				firstName: 'firstName',
			});

			const result: string = await service.getDisplayName(user);

			expect(result).toEqual(`${user.firstName} ${user.lastName}`);
			expect(roleService.getProtectedRoles).toHaveBeenCalled();
		});
	});

	describe('patchLanguage', () => {
		let user: User;

		beforeEach(() => {
			user = userFactory.buildWithId({ roles: [] });
			userRepo.findById.mockResolvedValue(user);
			config.get.mockReturnValue(['de']);
		});

		it('should patch language auf passed userId', async () => {
			await service.patchLanguage(user.id, LanguageType.DE);

			expect(userRepo.findById).toHaveBeenCalledWith(user.id);
			expect(userRepo.save).toHaveBeenCalledWith(user);
		});

		it('should throw an error if language is not activated', async () => {
			await expect(service.patchLanguage(user.id, LanguageType.EN)).rejects.toThrowError();
		});
	});

	describe('save is called', () => {
		describe('when saving a new user', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).build({
					firstName: 'firstName',
					lastName: 'lastName',
					schoolId: 'schoolId',
					email: 'email',
				});

				userDORepo.save.mockResolvedValue(user);

				return {
					user,
				};
			};

			it('should call the userDORepo.save', async () => {
				const { user } = setup();

				await service.save(user);

				expect(userDORepo.save).toHaveBeenCalledWith(user);
			});

			it('should return the saved user', async () => {
				const { user } = setup();

				const result: UserDO = await service.save(user);

				expect(result).toEqual(user);
			});
		});
	});

	describe('findByExternalId is called', () => {
		describe('when a user with this external id exists', () => {
			it('should return the user', async () => {
				const user: UserDO = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).build({
					firstName: 'firstName',
					lastName: 'lastName',
					schoolId: 'schoolId',
					email: 'email',
					externalId: 'externalId',
				});

				userDORepo.findByExternalId.mockResolvedValue(user);

				const result: UserDO | null = await service.findByExternalId('externalId', 'systemId');

				expect(result).toEqual(user);
			});
		});

		describe('when a user with this external id does not exist', () => {
			it('should return null', async () => {
				userDORepo.findByExternalId.mockResolvedValue(null);

				const result: UserDO | null = await service.findByExternalId('externalId', 'systemId');

				expect(result).toEqual(null);
			});
		});
	});

	describe('findByEmail is called', () => {
		describe('when a user with this email exists', () => {
			it('should return the user', async () => {
				const user: UserDO = userDoFactory.buildWithId();

				userDORepo.findByEmail.mockResolvedValue([user]);

				const result: UserDO[] = await service.findByEmail(user.email);

				expect(result).toEqual([user]);
			});
		});
	});

	describe('findUsers is called', () => {
		it('should call the repo with given query and options', async () => {
			const query: UserQuery = {
				schoolId: 'schoolId',
				isOutdated: true,
			};
			const options: IFindOptions<UserDO> = { order: { id: SortOrder.asc } };

			await service.findUsers(query, options);

			expect(userDORepo.find).toHaveBeenCalledWith(query, options);
		});
	});

	describe('saveAll is called', () => {
		it('should call the repo with given users', async () => {
			const users: UserDO[] = [userDoFactory.buildWithId()];

			await service.saveAll(users);

			expect(userDORepo.saveAll).toHaveBeenCalledWith(users);
		});
	});

	describe('removeUserRegistrationPin', () => {
		describe('when registrationPinService.deleteUserData return DomainDeletionReport', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const userId = user.id;
				const userRegistrationPinId = new ObjectId().toHexString();

				const results = [
					DomainDeletionReportBuilder.build(DomainName.REGISTRATIONPIN, [
						DomainOperationReportBuilder.build(OperationType.DELETE, 1, [userRegistrationPinId]),
					]),
				];

				const expectedResult = DomainDeletionReportBuilder.build(DomainName.REGISTRATIONPIN, [
					DomainOperationReportBuilder.build(OperationType.DELETE, 1, [userRegistrationPinId]),
				]);

				userRepo.findByIdOrNull.mockResolvedValueOnce(user);
				userRepo.getParentEmailsFromUser.mockResolvedValueOnce([]);
				registrationPinService.deleteUserData.mockResolvedValue(results[0]);

				return {
					expectedResult,
					userId,
					user,
				};
			};

			it('should return domainOperation object with information about deleted registrationsPin', async () => {
				const { userId, expectedResult } = setup();

				const result = await service.removeUserRegistrationPin(userId);

				expect(result).toEqual(expectedResult);
			});
		});

		describe('when no emails for registrationPin found', () => {
			const setup = () => {
				const user = userFactory.buildWithId({ email: undefined });
				const userId = user.id;

				const expectedResult = DomainDeletionReportBuilder.build(DomainName.REGISTRATIONPIN, [
					DomainOperationReportBuilder.build(OperationType.DELETE, 0, []),
				]);

				userRepo.findByIdOrNull.mockResolvedValueOnce(user);
				userRepo.getParentEmailsFromUser.mockResolvedValueOnce([]);

				return {
					expectedResult,
					userId,
					user,
				};
			};

			it('should return domainOperation object with proper information: count=0, and empty refs array', async () => {
				const { userId, expectedResult } = setup();

				const result = await service.removeUserRegistrationPin(userId);

				expect(result).toEqual(expectedResult);
			});
		});
	});

	describe('deleteUserData', () => {
		describe('when user is missing', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();
				const userId: EntityId = user.id;

				userRepo.findByIdOrNull.mockResolvedValueOnce(null);
				userRepo.deleteUser.mockResolvedValue(0);

				const expectedResult = DomainDeletionReportBuilder.build(DomainName.USER, [
					DomainOperationReportBuilder.build(OperationType.DELETE, 0, []),
				]);

				return {
					expectedResult,
					userId,
				};
			};

			it('should call userRepo.findByIdOrNull with userId', async () => {
				const { userId } = setup();

				await service.deleteUserData(userId);

				expect(userRepo.findByIdOrNull).toHaveBeenCalledWith(userId, true);
			});

			it('should return domainOperation object with information about deleted user', async () => {
				const { expectedResult, userId } = setup();

				const result = await service.deleteUserData(userId);

				expect(result).toEqual(expectedResult);
			});

			it('should Not call userRepo.deleteUser with userId', async () => {
				const { userId } = setup();

				await service.deleteUserData(userId);

				expect(userRepo.deleteUser).not.toHaveBeenCalled();
			});
		});

		describe('when user exists', () => {
			const setup = () => {
				const user = userFactory.buildWithId();

				const registrationPinDeleted = DomainDeletionReportBuilder.build(DomainName.REGISTRATIONPIN, [
					DomainOperationReportBuilder.build(OperationType.DELETE, 1, [new ObjectId().toHexString()]),
				]);

				const expectedResult = DomainDeletionReportBuilder.build(
					DomainName.USER,
					[DomainOperationReportBuilder.build(OperationType.DELETE, 1, [user.id])],
					[registrationPinDeleted]
				);

				jest.spyOn(service, 'removeUserRegistrationPin').mockResolvedValueOnce(registrationPinDeleted);
				userRepo.findByIdOrNull.mockResolvedValueOnce(user);
				userRepo.deleteUser.mockResolvedValue(1);

				return {
					expectedResult,
					user,
				};
			};

			it('should call userRepo.findByIdOrNull with userId', async () => {
				const { user } = setup();

				await service.deleteUserData(user.id);

				expect(userRepo.findByIdOrNull).toHaveBeenCalledWith(user.id, true);
			});

			it('should call userRepo.deleteUser with userId', async () => {
				const { user } = setup();

				await service.deleteUserData(user.id);

				expect(userRepo.deleteUser).toHaveBeenCalledWith(user.id);
			});

			it('should return domainOperation object with information about deleted user', async () => {
				const { expectedResult, user } = setup();

				const result = await service.deleteUserData(user.id);

				expect(result).toEqual(expectedResult);
			});
		});

		describe('when user exists but userRepo.deleteUser return 0', () => {
			const setup = () => {
				const user = userFactory.buildWithId();

				const registrationPinDeleted = DomainDeletionReportBuilder.build(DomainName.REGISTRATIONPIN, [
					DomainOperationReportBuilder.build(OperationType.DELETE, 1, [new ObjectId().toHexString()]),
				]);

				jest.spyOn(service, 'removeUserRegistrationPin').mockResolvedValueOnce(registrationPinDeleted);
				userRepo.findByIdOrNull.mockResolvedValueOnce(user);
				userRepo.deleteUser.mockResolvedValue(0);

				const expectedError = new DeletionErrorLoggableException(
					`Failed to delete user '${user.id}' from User collection`
				);

				return {
					expectedError,
					user,
				};
			};

			it('should throw an error', async () => {
				const { expectedError, user } = setup();

				await expect(service.deleteUserData(user.id)).rejects.toThrowError(expectedError);
			});
		});
	});

	describe('getParentEmailsFromUser', () => {
		const setup = () => {
			const user: User = userFactory.asStudent().buildWithId();
			const parentEmail = ['test@test.eu'];

			userRepo.getParentEmailsFromUser.mockResolvedValue(parentEmail);

			return {
				user,
				parentEmail,
			};
		};

		it('should call userRepo.getParentEmailsFromUse', async () => {
			const { user } = setup();

			await service.getParentEmailsFromUser(user.id);

			expect(userRepo.getParentEmailsFromUser).toBeCalledWith(user.id);
		});

		it('should return array with parent emails', async () => {
			const { user, parentEmail } = setup();

			const result = await service.getParentEmailsFromUser(user.id);
			expect(result).toEqual(parentEmail);
		});
	});

	describe('findUserBySchoolAndName', () => {
		describe('when searching for users by school and name', () => {
			const setup = () => {
				const firstName = 'Frist';
				const lastName = 'Last';
				const users: User[] = userFactory.buildListWithId(2, { firstName, lastName });

				userRepo.findUserBySchoolAndName.mockResolvedValue(users);

				return {
					firstName,
					lastName,
					users,
				};
			};

			it('should return a list of users', async () => {
				const { firstName, lastName, users } = setup();

				const result: User[] = await service.findUserBySchoolAndName(new ObjectId().toHexString(), firstName, lastName);

				expect(result).toEqual(users);
			});
		});
	});

	describe('handle', () => {
		const setup = () => {
			const targetRefId = new ObjectId().toHexString();
			const targetRefDomain = DomainName.FILERECORDS;
			const deletionRequest = deletionRequestFactory.build({ targetRefId, targetRefDomain });
			const deletionRequestId = deletionRequest.id;

			const expectedData = DomainDeletionReportBuilder.build(DomainName.FILERECORDS, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 2, [
					new ObjectId().toHexString(),
					new ObjectId().toHexString(),
				]),
			]);

			return {
				deletionRequestId,
				expectedData,
				targetRefId,
			};
		};

		describe('when UserDeletedEvent is received', () => {
			it('should call deleteUserData in userService', async () => {
				const { deletionRequestId, expectedData, targetRefId } = setup();

				jest.spyOn(service, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await service.handle({ deletionRequestId, targetRefId });

				expect(service.deleteUserData).toHaveBeenCalledWith(targetRefId);
			});

			it('should call eventBus.publish with DataDeletedEvent', async () => {
				const { deletionRequestId, expectedData, targetRefId } = setup();

				jest.spyOn(service, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await service.handle({ deletionRequestId, targetRefId });

				expect(eventBus.publish).toHaveBeenCalledWith(new DataDeletedEvent(deletionRequestId, expectedData));
			});
		});
	});
});
