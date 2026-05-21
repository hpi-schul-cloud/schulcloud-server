import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AccountService } from '@modules/account';
import { ErwinIdentifierService, ReferencedEntityType } from '@modules/erwin-identifier';
import { erwinIdentifierFactoryWithUser } from '@modules/erwin-identifier/testing';
import { RoleDto, RoleName, RoleService } from '@modules/role';
import { SchoolService } from '@modules/school';
import { schoolFactory } from '@modules/school/testing';
import { UserService } from '@modules/user';
import { userDoFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalSchoolDto, ExternalUserDto, ProvisioningSystemDto } from '../dto';
import {
	BadDataLoggableException,
	SchoolMissingLoggableException,
	UserRoleUnknownLoggableException,
} from '../loggable';
import { externalSchoolDtoFactory, externalUserDtoFactory, provisioningSystemDtoFactory } from '../testing';
import { ProvisioningContext } from './erwin-provisioning-handler.interface';
import { UserProvisioningHandler } from './user-provisioning.handler';

describe('UserProvisioningHandler', () => {
	let module: TestingModule;
	let sut: UserProvisioningHandler;
	let userServiceMock: DeepMocked<UserService>;
	let roleServiceMock: DeepMocked<RoleService>;
	let accountServiceMock: DeepMocked<AccountService>;
	let schoolServiceMock: DeepMocked<SchoolService>;
	let erwinIdentifierServiceMock: DeepMocked<ErwinIdentifierService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserProvisioningHandler,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
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
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: ErwinIdentifierService,
					useValue: createMock<ErwinIdentifierService>(),
				},
			],
		}).compile();

		sut = module.get(UserProvisioningHandler);
		userServiceMock = module.get(UserService);
		roleServiceMock = module.get(RoleService);
		accountServiceMock = module.get(AccountService);
		schoolServiceMock = module.get(SchoolService);
		erwinIdentifierServiceMock = module.get(ErwinIdentifierService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	it('should have correct referencedEntityType', () => {
		expect(sut.referencedEntityType).toBe(ReferencedEntityType.USER);
	});

	it('should have correct dtoName', () => {
		expect(sut.dtoName).toBe('ExternalUserDto');
	});

	describe('validate', () => {
		describe('when externalUser and externalSchool are provided', () => {
			it('should not throw', () => {
				const context: ProvisioningContext = {
					system: provisioningSystemDtoFactory.build(),
					externalSchool: externalSchoolDtoFactory.build(),
					externalUser: externalUserDtoFactory.build(),
				};

				expect(() => sut.validate(context)).not.toThrow();
			});
		});

		describe('when externalUser is not provided', () => {
			it('should throw BadDataLoggableException', () => {
				const context: ProvisioningContext = {
					system: provisioningSystemDtoFactory.build(),
					externalSchool: externalSchoolDtoFactory.build(),
				};

				expect(() => sut.validate(context)).toThrow(BadDataLoggableException);
			});
		});

		describe('when externalSchool is not provided', () => {
			it('should throw BadDataLoggableException', () => {
				const context: ProvisioningContext = {
					system: provisioningSystemDtoFactory.build(),
					externalUser: externalUserDtoFactory.build(),
				};

				expect(() => sut.validate(context)).toThrow(BadDataLoggableException);
			});
		});
	});

	describe('getExternalData', () => {
		it('should return externalUser', () => {
			const externalUser = externalUserDtoFactory.build();
			const context: ProvisioningContext = {
				system: provisioningSystemDtoFactory.build(),
				externalSchool: externalSchoolDtoFactory.build(),
				externalUser,
			};

			const result = sut.getExternalData(context);

			expect(result).toBe(externalUser);
		});
	});

	describe('getErwinId', () => {
		describe('when externalUser has erwinId', () => {
			it('should return erwinId', () => {
				const erwinId = new ObjectId().toHexString();
				const context: ProvisioningContext = {
					system: provisioningSystemDtoFactory.build(),
					externalSchool: externalSchoolDtoFactory.build(),
					externalUser: externalUserDtoFactory.build({ erwinId }),
				};

				const result = sut.getErwinId(context);

				expect(result).toBe(erwinId);
			});
		});

		describe('when externalUser has no erwinId', () => {
			it('should return undefined', () => {
				const context: ProvisioningContext = {
					system: provisioningSystemDtoFactory.build(),
					externalSchool: externalSchoolDtoFactory.build(),
					externalUser: externalUserDtoFactory.build({ erwinId: undefined }),
				};

				const result = sut.getErwinId(context);

				expect(result).toBeUndefined();
			});
		});

		describe('when externalUser is not provided', () => {
			it('should return undefined', () => {
				const context: ProvisioningContext = {
					system: provisioningSystemDtoFactory.build(),
					externalSchool: externalSchoolDtoFactory.build(),
				};

				const result = sut.getErwinId(context);

				expect(result).toBeUndefined();
			});
		});
	});

	describe('findByEntityId', () => {
		it('should call userService.findByIdOrNull', async () => {
			const entityId = new ObjectId().toHexString();
			const user = userDoFactory.buildWithId();
			userServiceMock.findByIdOrNull.mockResolvedValueOnce(user);

			const result = await sut.findByEntityId(entityId);

			expect(userServiceMock.findByIdOrNull).toHaveBeenCalledWith(entityId);
			expect(result).toBe(user);
		});
	});

	describe('findByExternalId', () => {
		const setup = () => {
			const school = schoolFactory.build();
			const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
			const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
				externalId: school.externalId,
			});
			const externalUser: ExternalUserDto = externalUserDtoFactory.build();
			const context: ProvisioningContext = { system, externalSchool, externalUser };
			const user = userDoFactory.buildWithId({ schoolId: school.id });

			schoolServiceMock.getSchools.mockResolvedValueOnce([school]);
			userServiceMock.findByExternalId.mockResolvedValueOnce(user);

			return { context, system, externalSchool, externalUser, school, user };
		};

		describe('when user is found and belongs to the school', () => {
			it('should return the user', async () => {
				const { context, system, externalSchool, externalUser, user } = setup();

				const result = await sut.findByExternalId(context);

				expect(schoolServiceMock.getSchools).toHaveBeenCalledWith({
					systemId: system.systemId,
					externalId: externalSchool.externalId,
				});
				expect(userServiceMock.findByExternalId).toHaveBeenCalledWith(externalUser.externalId, system.systemId);
				expect(result).toBe(user);
			});
		});

		describe('when user is found but belongs to a different school', () => {
			it('should return null', async () => {
				const school = schoolFactory.build();
				const differentSchoolId = new ObjectId().toHexString();
				const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
					externalId: school.externalId,
				});
				const externalUser: ExternalUserDto = externalUserDtoFactory.build();
				const context: ProvisioningContext = { system, externalSchool, externalUser };
				const user = userDoFactory.buildWithId({ schoolId: differentSchoolId });

				schoolServiceMock.getSchools.mockResolvedValueOnce([school]);
				userServiceMock.findByExternalId.mockResolvedValueOnce(user);

				const result = await sut.findByExternalId(context);

				expect(result).toBeNull();
			});
		});

		describe('when school is not found', () => {
			it('should return null', async () => {
				const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build();
				const externalUser: ExternalUserDto = externalUserDtoFactory.build();
				const context: ProvisioningContext = { system, externalSchool, externalUser };

				schoolServiceMock.getSchools.mockResolvedValueOnce([]);

				const result = await sut.findByExternalId(context);

				expect(result).toBeNull();
				expect(userServiceMock.findByExternalId).not.toHaveBeenCalled();
			});
		});

		describe('when no user is found', () => {
			it('should return null', async () => {
				const school = schoolFactory.build();
				const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
					externalId: school.externalId,
				});
				const externalUser: ExternalUserDto = externalUserDtoFactory.build();
				const context: ProvisioningContext = { system, externalSchool, externalUser };

				schoolServiceMock.getSchools.mockResolvedValueOnce([school]);
				userServiceMock.findByExternalId.mockResolvedValueOnce(null);

				const result = await sut.findByExternalId(context);

				expect(result).toBeNull();
			});
		});
	});

	describe('create', () => {
		describe('when creating a new user', () => {
			const setup = () => {
				const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
				const school = schoolFactory.build();
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
					externalId: school.externalId,
				});
				const externalUser: ExternalUserDto = externalUserDtoFactory.build({
					erwinId: new ObjectId().toHexString(),
					firstName: 'John',
					lastName: 'Doe',
					email: 'john.doe@example.com',
					roles: [RoleName.STUDENT],
				});
				const context: ProvisioningContext = { system, externalSchool, externalUser };
				const roleDto: RoleDto = {
					id: new ObjectId().toHexString(),
					name: RoleName.STUDENT,
					permissions: [],
				};
				const savedUser = userDoFactory.buildWithId({
					firstName: externalUser.firstName,
					lastName: externalUser.lastName,
					email: externalUser.email,
					schoolId: school.id,
				});

				schoolServiceMock.getSchools.mockResolvedValueOnce([school]);
				roleServiceMock.findByNames.mockResolvedValueOnce([roleDto]);
				userServiceMock.save.mockResolvedValueOnce(savedUser);
				erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);
				erwinIdentifierServiceMock.createErwinIdentifier.mockResolvedValueOnce(erwinIdentifierFactoryWithUser.build());

				return { context, externalUser, savedUser, school, roleDto };
			};

			it('should return saved user', async () => {
				const { context, savedUser } = setup();

				const result = await sut.create(context);

				expect(result).toBe(savedUser);
			});

			it('should save user with correct properties', async () => {
				const { context, externalUser, school } = setup();

				await sut.create(context);

				expect(userServiceMock.save).toHaveBeenCalledWith(
					expect.objectContaining({
						firstName: externalUser.firstName,
						lastName: externalUser.lastName,
						email: externalUser.email,
						externalId: externalUser.externalId,
						schoolId: school.id,
					})
				);
			});

			it('should create account for user', async () => {
				const { context, savedUser } = setup();

				await sut.create(context);

				expect(accountServiceMock.saveWithValidation).toHaveBeenCalledWith(
					expect.objectContaining({
						userId: savedUser.id,
						systemId: context.system.systemId,
						activated: true,
					})
				);
			});

			it('should create erwin identifier', async () => {
				const { context, externalUser, savedUser } = setup();

				await sut.create(context);

				expect(erwinIdentifierServiceMock.createErwinIdentifier).toHaveBeenCalledWith({
					erwinId: externalUser.erwinId,
					type: ReferencedEntityType.USER,
					referencedEntityId: savedUser.id,
				});
			});
		});

		describe('when school is not found', () => {
			const setup = () => {
				const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build();
				const externalUser: ExternalUserDto = externalUserDtoFactory.build({
					roles: [RoleName.STUDENT],
				});
				const context: ProvisioningContext = { system, externalSchool, externalUser };

				schoolServiceMock.getSchools.mockResolvedValueOnce([]);

				return { context };
			};

			it('should throw SchoolMissingLoggableException', async () => {
				const { context } = setup();

				await expect(sut.create(context)).rejects.toThrow(SchoolMissingLoggableException);
			});
		});

		describe('when roles are not found', () => {
			const setup = () => {
				const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
				const school = schoolFactory.build();
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
					externalId: school.externalId,
				});
				const externalUser: ExternalUserDto = externalUserDtoFactory.build({
					roles: [RoleName.STUDENT],
				});
				const context: ProvisioningContext = { system, externalSchool, externalUser };

				schoolServiceMock.getSchools.mockResolvedValueOnce([school]);
				roleServiceMock.findByNames.mockResolvedValueOnce([]);

				return { context };
			};

			it('should throw UserRoleUnknownLoggableException', async () => {
				const { context } = setup();

				await expect(sut.create(context)).rejects.toThrow(UserRoleUnknownLoggableException);
			});
		});

		describe('when creating a user without erwinId', () => {
			const setup = () => {
				const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
				const school = schoolFactory.build();
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
					externalId: school.externalId,
				});
				const externalUser: ExternalUserDto = externalUserDtoFactory.build({
					erwinId: undefined,
					roles: [RoleName.STUDENT],
				});
				const context: ProvisioningContext = { system, externalSchool, externalUser };
				const roleDto: RoleDto = {
					id: new ObjectId().toHexString(),
					name: RoleName.STUDENT,
					permissions: [],
				};
				const savedUser = userDoFactory.buildWithId();

				schoolServiceMock.getSchools.mockResolvedValueOnce([school]);
				roleServiceMock.findByNames.mockResolvedValueOnce([roleDto]);
				userServiceMock.save.mockResolvedValueOnce(savedUser);

				return { context };
			};

			it('should not create erwin identifier', async () => {
				const { context } = setup();

				await sut.create(context);

				expect(erwinIdentifierServiceMock.createErwinIdentifier).not.toHaveBeenCalled();
			});
		});

		describe('when creating a user with empty optional fields', () => {
			const setup = () => {
				const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
				const school = schoolFactory.build();
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
					externalId: school.externalId,
				});
				const externalUser: ExternalUserDto = new ExternalUserDto({
					externalId: new ObjectId().toHexString(),
					roles: [RoleName.STUDENT],
					firstName: undefined,
					lastName: undefined,
					email: undefined,
				});
				const context: ProvisioningContext = { system, externalSchool, externalUser };
				const roleDto: RoleDto = {
					id: new ObjectId().toHexString(),
					name: RoleName.STUDENT,
					permissions: [],
				};
				const savedUser = userDoFactory.buildWithId();

				schoolServiceMock.getSchools.mockResolvedValueOnce([school]);
				roleServiceMock.findByNames.mockResolvedValueOnce([roleDto]);
				userServiceMock.save.mockResolvedValueOnce(savedUser);

				return { context };
			};

			it('should save user with empty strings as defaults', async () => {
				const { context } = setup();

				await sut.create(context);

				expect(userServiceMock.save).toHaveBeenCalledWith(
					expect.objectContaining({
						firstName: '',
						lastName: '',
						email: '',
					})
				);
			});
		});

		describe('when erwin identifier already exists', () => {
			const setup = () => {
				const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
				const school = schoolFactory.build();
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
					externalId: school.externalId,
				});
				const externalUser: ExternalUserDto = externalUserDtoFactory.build({
					erwinId: new ObjectId().toHexString(),
					roles: [RoleName.STUDENT],
				});
				const context: ProvisioningContext = { system, externalSchool, externalUser };
				const roleDto: RoleDto = {
					id: new ObjectId().toHexString(),
					name: RoleName.STUDENT,
					permissions: [],
				};
				const savedUser = userDoFactory.buildWithId();
				const existingIdentifier = erwinIdentifierFactoryWithUser.build();

				schoolServiceMock.getSchools.mockResolvedValueOnce([school]);
				roleServiceMock.findByNames.mockResolvedValueOnce([roleDto]);
				userServiceMock.save.mockResolvedValueOnce(savedUser);
				erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(existingIdentifier);

				return { context };
			};

			it('should not create duplicate erwin identifier', async () => {
				const { context } = setup();

				await sut.create(context);

				expect(erwinIdentifierServiceMock.createErwinIdentifier).not.toHaveBeenCalled();
			});
		});
	});

	describe('update', () => {
		describe('when updating a user', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();
				const externalUser: ExternalUserDto = externalUserDtoFactory.build({
					firstName: 'Updated',
					lastName: 'Name',
					email: 'updated@example.com',
					preferredName: 'Nick',
					birthday: new Date('1990-01-01'),
					roles: [RoleName.TEACHER],
				});
				const roleDto: RoleDto = {
					id: new ObjectId().toHexString(),
					name: RoleName.TEACHER,
					permissions: [],
				};
				const updatedUser = userDoFactory.buildWithId({
					firstName: externalUser.firstName,
					lastName: externalUser.lastName,
					email: externalUser.email,
				});

				roleServiceMock.findByNames.mockResolvedValueOnce([roleDto]);
				userServiceMock.save.mockResolvedValueOnce(updatedUser);

				return { user, externalUser, updatedUser, roleDto };
			};

			it('should return updated user', async () => {
				const { user, externalUser, updatedUser } = setup();

				const result = await sut.update(user, externalUser);

				expect(result).toBe(updatedUser);
			});

			it('should update user properties', async () => {
				const { user, externalUser } = setup();

				await sut.update(user, externalUser);

				expect(user.firstName).toBe(externalUser.firstName);
				expect(user.lastName).toBe(externalUser.lastName);
				expect(user.email).toBe(externalUser.email);
				expect(user.preferredName).toBe(externalUser.preferredName);
				expect(user.birthday).toBe(externalUser.birthday);
			});

			it('should update user roles', async () => {
				const { user, externalUser, roleDto } = setup();

				await sut.update(user, externalUser);

				expect(user.roles).toEqual([
					expect.objectContaining({
						id: roleDto.id,
						name: roleDto.name,
					}),
				]);
			});

			it('should save user', async () => {
				const { user, externalUser } = setup();

				await sut.update(user, externalUser);

				expect(userServiceMock.save).toHaveBeenCalledWith(user);
			});
		});

		describe('when externalUser has no properties to update', () => {
			it('should not update user properties', async () => {
				const originalFirstName = 'Original';
				const originalLastName = 'Name';
				const user = userDoFactory.buildWithId({
					firstName: originalFirstName,
					lastName: originalLastName,
				});
				const externalUser: ExternalUserDto = new ExternalUserDto({
					externalId: new ObjectId().toHexString(),
					roles: [],
				});
				userServiceMock.save.mockResolvedValueOnce(user);

				await sut.update(user, externalUser);

				expect(user.firstName).toBe(originalFirstName);
				expect(user.lastName).toBe(originalLastName);
			});
		});

		describe('when roles are not found', () => {
			it('should not update roles', async () => {
				const originalRoles = [{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }];
				const user = userDoFactory.buildWithId();
				user.roles = originalRoles.map((r) => {
					return { id: r.id, name: r.name };
				});
				const externalUser: ExternalUserDto = externalUserDtoFactory.build({
					roles: [RoleName.TEACHER],
				});
				roleServiceMock.findByNames.mockResolvedValueOnce([]);
				userServiceMock.save.mockResolvedValueOnce(user);

				await sut.update(user, externalUser);

				expect(user.roles).toEqual(
					originalRoles.map((r) => {
						return { id: r.id, name: r.name };
					})
				);
			});
		});
	});
});
