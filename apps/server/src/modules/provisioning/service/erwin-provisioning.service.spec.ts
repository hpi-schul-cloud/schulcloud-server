import { Logger } from '@core/logger/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AccountService } from '@modules/account';
import { ErwinIdentifierService, ReferencedEntityType } from '@modules/erwin-identifier';
import {
	erwinIdentifierFactoryWithSchool,
	erwinIdentifierFactoryWithUser,
} from '@modules/erwin-identifier/domain/testing';
import { RoleService, RoleDto, RoleName } from '@modules/role';
import { SchoolService } from '@modules/school';
import { SchoolYearService } from '@modules/school/domain';
import { schoolFactory, schoolYearEntityFactory } from '@modules/school/testing';
import { UserService } from '@modules/user';
import { userDoFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalSchoolDto, ExternalUserDto, ProvisioningSystemDto } from '../dto';
import { BadDataLoggableException, SchoolNameRequiredLoggableException } from '../loggable';
import { ExternalIdMissingLoggableException } from '../loggable/external-id-missing.loggable-exception';
import { externalSchoolDtoFactory, externalUserDtoFactory, provisioningSystemDtoFactory } from '../testing';
import { ErwinProvisioningService, ProvisioningEntityType } from './erwin-provisioning.service';

describe('ErwinProvisioningService', () => {
	let module: TestingModule;
	let sut: ErwinProvisioningService;
	let schoolServiceMock: DeepMocked<SchoolService>;
	let erwinIdentifierServiceMock: DeepMocked<ErwinIdentifierService>;
	let schoolYearServiceMock: DeepMocked<SchoolYearService>;
	let userServiceMock: DeepMocked<UserService>;
	let roleServiceMock: DeepMocked<RoleService>;
	let accountServiceMock: DeepMocked<AccountService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ErwinProvisioningService,
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: ErwinIdentifierService,
					useValue: createMock<ErwinIdentifierService>(),
				},
				{
					provide: SchoolYearService,
					useValue: createMock<SchoolYearService>(),
				},
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
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		sut = module.get(ErwinProvisioningService);
		schoolServiceMock = module.get(SchoolService);
		erwinIdentifierServiceMock = module.get(ErwinIdentifierService);
		schoolYearServiceMock = module.get(SchoolYearService);
		userServiceMock = module.get(UserService);
		roleServiceMock = module.get(RoleService);
		accountServiceMock = module.get(AccountService);
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

	describe('provisionEntity', () => {
		describe('when entity type is SCHOOL', () => {
			describe('when school is found by erwinId and externalId is provided', () => {
				const setup = () => {
					const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
					const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
						erwinId: new ObjectId().toHexString(),
						name: 'School Name',
						officialSchoolNumber: '12345',
					});
					const existingSchool = schoolFactory.build();
					const erwinIdentifier = erwinIdentifierFactoryWithSchool.build({
						erwinId: externalSchool.erwinId,
						referencedEntityId: existingSchool.id,
					});
					const updatedSchool = schoolFactory.build({
						name: externalSchool.name,
					});

					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(erwinIdentifier);
					schoolServiceMock.getSchoolById.mockResolvedValueOnce(existingSchool);
					schoolServiceMock.save.mockResolvedValueOnce(updatedSchool);

					return { system, externalSchool, updatedSchool };
				};

				it('should return updated school', async () => {
					const { system, externalSchool, updatedSchool } = setup();

					const result = await sut.provisionEntity(ProvisioningEntityType.SCHOOL, system, { externalSchool });

					expect(result).toEqual(updatedSchool);
				});

				it('should save school', async () => {
					const { system, externalSchool } = setup();

					await sut.provisionEntity(ProvisioningEntityType.SCHOOL, system, { externalSchool });

					expect(schoolServiceMock.save).toHaveBeenCalled();
				});
			});

			describe('when school is found by erwinId but externalId is not provided', () => {
				const setup = () => {
					const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
					const externalSchool: ExternalSchoolDto = new ExternalSchoolDto({
						externalId: undefined as unknown as string,
						erwinId: new ObjectId().toHexString(),
						name: 'School Name',
					});
					const existingSchool = schoolFactory.build();
					const erwinIdentifier = erwinIdentifierFactoryWithSchool.build({
						erwinId: externalSchool.erwinId,
						referencedEntityId: existingSchool.id,
					});

					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(erwinIdentifier);
					schoolServiceMock.getSchoolById.mockResolvedValueOnce(existingSchool);

					return { system, externalSchool, existingSchool };
				};

				it('should return existing school without update', async () => {
					const { system, externalSchool, existingSchool } = setup();

					const result = await sut.provisionEntity(ProvisioningEntityType.SCHOOL, system, { externalSchool });

					expect(result).toEqual(existingSchool);
					expect(schoolServiceMock.save).not.toHaveBeenCalled();
				});
			});

			describe('when school is not found by erwinId and externalId is missing', () => {
				const setup = () => {
					const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
					const externalSchool: ExternalSchoolDto = new ExternalSchoolDto({
						externalId: undefined as unknown as string,
						erwinId: new ObjectId().toHexString(),
						name: 'School Name',
					});

					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);

					return { system, externalSchool };
				};

				it('should throw ExternalIdMissingException', async () => {
					const { system, externalSchool } = setup();

					await expect(sut.provisionEntity(ProvisioningEntityType.SCHOOL, system, { externalSchool })).rejects.toThrow(
						ExternalIdMissingLoggableException
					);
				});
			});

			describe('when school is not found by erwinId but is found by externalId', () => {
				const setup = () => {
					const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
					const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
						erwinId: new ObjectId().toHexString(),
						name: 'Updated School Name',
						officialSchoolNumber: '12345',
					});
					const existingSchool = schoolFactory.build({
						externalId: externalSchool.externalId,
						systemIds: [system.systemId],
					});
					const updatedSchool = schoolFactory.build({
						name: externalSchool.name,
					});

					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);
					schoolServiceMock.getSchools.mockResolvedValueOnce([existingSchool]);
					schoolServiceMock.save.mockResolvedValueOnce(updatedSchool);
					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);
					erwinIdentifierServiceMock.createErwinIdentifier.mockResolvedValueOnce(
						erwinIdentifierFactoryWithSchool.build()
					);

					return { system, externalSchool, updatedSchool };
				};

				it('should return updated school', async () => {
					const { system, externalSchool, updatedSchool } = setup();

					const result = await sut.provisionEntity(ProvisioningEntityType.SCHOOL, system, { externalSchool });

					expect(result).toEqual(updatedSchool);
				});

				it('should create Erwin identifier', async () => {
					const { system, externalSchool, updatedSchool } = setup();

					await sut.provisionEntity(ProvisioningEntityType.SCHOOL, system, { externalSchool });

					expect(erwinIdentifierServiceMock.createErwinIdentifier).toHaveBeenCalledWith({
						erwinId: externalSchool.erwinId,
						type: ReferencedEntityType.SCHOOL,
						referencedEntityId: updatedSchool.id,
					});
				});
			});

			describe('when school is found by externalId without erwinId', () => {
				const setup = () => {
					const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
					const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
						erwinId: undefined,
						name: 'Updated School Name',
					});
					const existingSchool = schoolFactory.build({
						externalId: externalSchool.externalId,
						systemIds: [system.systemId],
					});
					const updatedSchool = schoolFactory.build({
						name: externalSchool.name,
					});

					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);
					schoolServiceMock.getSchools.mockResolvedValueOnce([existingSchool]);
					schoolServiceMock.save.mockResolvedValueOnce(updatedSchool);

					return { system, externalSchool, updatedSchool };
				};

				it('should not create Erwin identifier', async () => {
					const { system, externalSchool } = setup();

					await sut.provisionEntity(ProvisioningEntityType.SCHOOL, system, { externalSchool });

					expect(erwinIdentifierServiceMock.createErwinIdentifier).not.toHaveBeenCalled();
				});
			});

			describe('when no school exists and a new school is created', () => {
				const setup = () => {
					const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
					const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
						erwinId: new ObjectId().toHexString(),
						name: 'New School Name',
						officialSchoolNumber: '12345',
					});
					const schoolYear = schoolYearEntityFactory.build();
					const newSchool = schoolFactory.build({
						name: externalSchool.name,
						externalId: externalSchool.externalId,
						officialSchoolNumber: externalSchool.officialSchoolNumber,
					});

					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);
					schoolServiceMock.getSchools.mockResolvedValueOnce([]);
					schoolYearServiceMock.getCurrentSchoolYear.mockResolvedValueOnce(schoolYear);
					schoolServiceMock.save.mockResolvedValueOnce(newSchool);
					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);
					erwinIdentifierServiceMock.createErwinIdentifier.mockResolvedValueOnce(
						erwinIdentifierFactoryWithSchool.build()
					);

					return { system, externalSchool, newSchool };
				};

				it('should return new school', async () => {
					const { system, externalSchool, newSchool } = setup();

					const result = await sut.provisionEntity(ProvisioningEntityType.SCHOOL, system, { externalSchool });

					expect(result).toEqual(newSchool);
				});

				it('should create erwin identifier', async () => {
					const { system, externalSchool, newSchool } = setup();

					await sut.provisionEntity(ProvisioningEntityType.SCHOOL, system, { externalSchool });

					expect(erwinIdentifierServiceMock.createErwinIdentifier).toHaveBeenCalledWith({
						erwinId: externalSchool.erwinId,
						type: ReferencedEntityType.SCHOOL,
						referencedEntityId: newSchool.id,
					});
				});
			});

			describe('when creating a new school with location', () => {
				const setup = () => {
					const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
					const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
						name: 'New School',
						location: 'Berlin',
					});
					const schoolYear = schoolYearEntityFactory.build();
					const expectedSchoolName = `${externalSchool.name ?? ''} (${externalSchool.location ?? ''})`;
					const newSchool = schoolFactory.build({
						name: expectedSchoolName,
						externalId: externalSchool.externalId,
					});

					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);
					schoolServiceMock.getSchools.mockResolvedValueOnce([]);
					schoolYearServiceMock.getCurrentSchoolYear.mockResolvedValueOnce(schoolYear);
					schoolServiceMock.save.mockResolvedValueOnce(newSchool);

					return { system, externalSchool, newSchool };
				};

				it('should append location to school name', async () => {
					const { system, externalSchool, newSchool } = setup();

					const result = await sut.provisionEntity(ProvisioningEntityType.SCHOOL, system, { externalSchool });

					expect(result).toEqual(newSchool);
					expect(schoolServiceMock.save).toHaveBeenCalled();
				});
			});

			describe('when creating a new school without name', () => {
				const setup = () => {
					const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
					const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
						name: undefined,
					});
					const schoolYear = schoolYearEntityFactory.build();

					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);
					schoolServiceMock.getSchools.mockResolvedValueOnce([]);
					schoolYearServiceMock.getCurrentSchoolYear.mockResolvedValueOnce(schoolYear);

					return { system, externalSchool };
				};

				it('should throw SchoolNameRequiredLoggableException', async () => {
					const { system, externalSchool } = setup();

					await expect(sut.provisionEntity(ProvisioningEntityType.SCHOOL, system, { externalSchool })).rejects.toThrow(
						SchoolNameRequiredLoggableException
					);
				});
			});

			describe('when erwin identifier already exists for school found by externalId', () => {
				const setup = () => {
					const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
					const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
						erwinId: new ObjectId().toHexString(),
						name: 'School Name',
					});
					const existingSchool = schoolFactory.build({
						externalId: externalSchool.externalId,
						systemIds: [system.systemId],
					});
					const updatedSchool = schoolFactory.build({
						name: externalSchool.name,
					});
					const existingErwinIdentifier = erwinIdentifierFactoryWithSchool.build({
						erwinId: externalSchool.erwinId,
					});

					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);
					schoolServiceMock.getSchools.mockResolvedValueOnce([existingSchool]);
					schoolServiceMock.save.mockResolvedValueOnce(updatedSchool);
					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(existingErwinIdentifier);

					return { system, externalSchool, updatedSchool };
				};

				it('should not create duplicate erwin identifier', async () => {
					const { system, externalSchool, updatedSchool } = setup();

					const result = await sut.provisionEntity(ProvisioningEntityType.SCHOOL, system, { externalSchool });

					expect(result).toEqual(updatedSchool);
					expect(erwinIdentifierServiceMock.createErwinIdentifier).not.toHaveBeenCalled();
				});
			});

			describe('when erwinId references a non-school entity', () => {
				const setup = () => {
					const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
					const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
						erwinId: new ObjectId().toHexString(),
						name: 'School Name',
					});
					const userErwinIdentifier = erwinIdentifierFactoryWithSchool.build({
						erwinId: externalSchool.erwinId,
						type: ReferencedEntityType.USER,
					});
					const schoolYear = schoolYearEntityFactory.build();
					const newSchool = schoolFactory.build({
						name: externalSchool.name,
					});

					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(userErwinIdentifier);
					schoolServiceMock.getSchools.mockResolvedValueOnce([]);
					schoolYearServiceMock.getCurrentSchoolYear.mockResolvedValueOnce(schoolYear);
					schoolServiceMock.save.mockResolvedValueOnce(newSchool);
					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);
					erwinIdentifierServiceMock.createErwinIdentifier.mockResolvedValueOnce(
						erwinIdentifierFactoryWithSchool.build()
					);

					return { system, externalSchool };
				};

				it('should create new school', async () => {
					const { system, externalSchool } = setup();

					await sut.provisionEntity(ProvisioningEntityType.SCHOOL, system, { externalSchool });

					expect(schoolServiceMock.save).toHaveBeenCalled();
				});
			});

			describe('when erwinId is not provided in externalSchool', () => {
				const setup = () => {
					const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
					const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
						erwinId: undefined,
						name: 'New School',
					});
					const schoolYear = schoolYearEntityFactory.build();
					const newSchool = schoolFactory.build({
						name: externalSchool.name,
						externalId: externalSchool.externalId,
					});

					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);
					schoolServiceMock.getSchools.mockResolvedValueOnce([]);
					schoolYearServiceMock.getCurrentSchoolYear.mockResolvedValueOnce(schoolYear);
					schoolServiceMock.save.mockResolvedValueOnce(newSchool);

					return { system, externalSchool, newSchool };
				};

				it('should create school without erwin identifier', async () => {
					const { system, externalSchool, newSchool } = setup();

					const result = await sut.provisionEntity(ProvisioningEntityType.SCHOOL, system, { externalSchool });

					expect(result).toEqual(newSchool);
					expect(erwinIdentifierServiceMock.createErwinIdentifier).not.toHaveBeenCalled();
				});
			});

			describe('when externalSchool is not provided', () => {
				it('should throw an error', async () => {
					const system = provisioningSystemDtoFactory.build();

					await expect(sut.provisionEntity(ProvisioningEntityType.SCHOOL, system, {})).rejects.toThrow(
						BadDataLoggableException
					);
				});
			});
		});

		describe('when entity type is USER', () => {
			describe('when user is found by erwinId and externalId is provided', () => {
				const setup = () => {
					const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
					const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build();
					const externalUser: ExternalUserDto = externalUserDtoFactory.build({
						erwinId: new ObjectId().toHexString(),
						firstName: 'John',
						lastName: 'Doe',
						email: 'john.doe@example.com',
					});
					const existingUser = userDoFactory.buildWithId();
					const erwinIdentifier = erwinIdentifierFactoryWithUser.build({
						erwinId: externalUser.erwinId,
						referencedEntityId: existingUser.id as string,
					});
					const updatedUser = userDoFactory.buildWithId({
						firstName: externalUser.firstName,
						lastName: externalUser.lastName,
					});

					const roleDto: RoleDto = {
						id: new ObjectId().toHexString(),
						name: RoleName.TEACHER,
						permissions: [],
					};

					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(erwinIdentifier);
					userServiceMock.findByIdOrNull.mockResolvedValueOnce(existingUser);
					roleServiceMock.findByNames.mockResolvedValueOnce([roleDto]);
					userServiceMock.save.mockResolvedValueOnce(updatedUser);

					return { system, externalSchool, externalUser, updatedUser };
				};

				it('should return updated user', async () => {
					const { system, externalSchool, externalUser, updatedUser } = setup();

					const result = await sut.provisionEntity(ProvisioningEntityType.USER, system, {
						externalSchool,
						externalUser,
					});

					expect(result).toEqual(updatedUser);
				});

				it('should save user with updated properties', async () => {
					const { system, externalSchool, externalUser } = setup();

					await sut.provisionEntity(ProvisioningEntityType.USER, system, {
						externalSchool,
						externalUser,
					});

					expect(userServiceMock.save).toHaveBeenCalled();
				});
			});

			describe('when user is found by erwinId but externalId is not provided', () => {
				const setup = () => {
					const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
					const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build();
					const externalUser: ExternalUserDto = new ExternalUserDto({
						externalId: undefined as unknown as string,
						erwinId: new ObjectId().toHexString(),
						roles: [],
					});
					const existingUser = userDoFactory.buildWithId();
					const erwinIdentifier = erwinIdentifierFactoryWithUser.build({
						erwinId: externalUser.erwinId,
						referencedEntityId: existingUser.id as string,
					});

					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(erwinIdentifier);
					userServiceMock.findByIdOrNull.mockResolvedValueOnce(existingUser);

					return { system, externalSchool, externalUser, existingUser };
				};

				it('should return existing user without update', async () => {
					const { system, externalSchool, externalUser, existingUser } = setup();

					const result = await sut.provisionEntity(ProvisioningEntityType.USER, system, {
						externalSchool,
						externalUser,
					});

					expect(result).toEqual(existingUser);
					expect(userServiceMock.save).not.toHaveBeenCalled();
				});
			});

			describe('when user is not found by erwinId and externalId is missing', () => {
				const setup = () => {
					const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
					const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build();
					const externalUser: ExternalUserDto = new ExternalUserDto({
						externalId: undefined as unknown as string,
						erwinId: new ObjectId().toHexString(),
						roles: [],
					});

					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);

					return { system, externalSchool, externalUser };
				};

				it('should throw ExternalIdMissingException', async () => {
					const { system, externalSchool, externalUser } = setup();

					await expect(
						sut.provisionEntity(ProvisioningEntityType.USER, system, { externalSchool, externalUser })
					).rejects.toThrow(ExternalIdMissingLoggableException);
				});
			});

			describe('when user is not found by erwinId but is found by externalId', () => {
				const setup = () => {
					const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
					const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build();
					const externalUser: ExternalUserDto = externalUserDtoFactory.build({
						erwinId: new ObjectId().toHexString(),
						firstName: 'Updated',
						lastName: 'User',
					});
					const existingUser = userDoFactory.buildWithId({
						externalId: externalUser.externalId,
					});
					const updatedUser = userDoFactory.buildWithId({
						firstName: externalUser.firstName,
						lastName: externalUser.lastName,
					});

					const roleDto: RoleDto = {
						id: new ObjectId().toHexString(),
						name: RoleName.TEACHER,
						permissions: [],
					};

					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);
					userServiceMock.findByExternalId.mockResolvedValueOnce(existingUser);
					roleServiceMock.findByNames.mockResolvedValueOnce([roleDto]);
					userServiceMock.save.mockResolvedValueOnce(updatedUser);
					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);
					erwinIdentifierServiceMock.createErwinIdentifier.mockResolvedValueOnce(
						erwinIdentifierFactoryWithUser.build()
					);

					return { system, externalSchool, externalUser, updatedUser };
				};

				it('should return updated user', async () => {
					const { system, externalSchool, externalUser, updatedUser } = setup();

					const result = await sut.provisionEntity(ProvisioningEntityType.USER, system, {
						externalSchool,
						externalUser,
					});

					expect(result).toEqual(updatedUser);
				});

				it('should create Erwin identifier', async () => {
					const { system, externalSchool, externalUser, updatedUser } = setup();

					await sut.provisionEntity(ProvisioningEntityType.USER, system, {
						externalSchool,
						externalUser,
					});

					expect(erwinIdentifierServiceMock.createErwinIdentifier).toHaveBeenCalledWith({
						erwinId: externalUser.erwinId,
						type: ReferencedEntityType.USER,
						referencedEntityId: updatedUser.id,
					});
				});
			});

			describe('when user is found by externalId without erwinId', () => {
				const setup = () => {
					const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
					const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build();
					const externalUser: ExternalUserDto = externalUserDtoFactory.build({
						erwinId: undefined,
						firstName: 'Updated',
					});
					const existingUser = userDoFactory.buildWithId({
						externalId: externalUser.externalId,
					});
					const updatedUser = userDoFactory.buildWithId({
						firstName: externalUser.firstName,
					});

					const roleDto: RoleDto = {
						id: new ObjectId().toHexString(),
						name: RoleName.TEACHER,
						permissions: [],
					};

					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);
					userServiceMock.findByExternalId.mockResolvedValueOnce(existingUser);
					roleServiceMock.findByNames.mockResolvedValueOnce([roleDto]);
					userServiceMock.save.mockResolvedValueOnce(updatedUser);

					return { system, externalSchool, externalUser, updatedUser };
				};

				it('should not create Erwin identifier', async () => {
					const { system, externalSchool, externalUser } = setup();

					await sut.provisionEntity(ProvisioningEntityType.USER, system, {
						externalSchool,
						externalUser,
					});

					expect(erwinIdentifierServiceMock.createErwinIdentifier).not.toHaveBeenCalled();
				});
			});

			describe('when no user exists and user creation is attempted', () => {
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
					const savedUser = userDoFactory.buildWithId({
						firstName: externalUser.firstName,
						lastName: externalUser.lastName,
						email: externalUser.email,
						schoolId: school.id,
					});
					const roleDto: RoleDto = {
						id: new ObjectId().toHexString(),
						name: RoleName.STUDENT,
						permissions: [],
					};

					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);
					userServiceMock.findByExternalId.mockResolvedValueOnce(null);
					schoolServiceMock.getSchools.mockResolvedValueOnce([school]);
					roleServiceMock.findByNames.mockResolvedValueOnce([roleDto]);
					userServiceMock.save.mockResolvedValueOnce(savedUser);

					return { system, externalSchool, externalUser, savedUser, school };
				};

				it('should create new user and return it', async () => {
					const { system, externalSchool, externalUser, savedUser } = setup();

					const result = await sut.provisionEntity(ProvisioningEntityType.USER, system, {
						externalSchool,
						externalUser,
					});

					expect(result).toEqual(savedUser);
				});

				it('should create account for the user', async () => {
					const { system, externalSchool, externalUser, savedUser } = setup();

					await sut.provisionEntity(ProvisioningEntityType.USER, system, { externalSchool, externalUser });

					expect(accountServiceMock.saveWithValidation).toHaveBeenCalledWith(
						expect.objectContaining({
							userId: savedUser.id,
							systemId: system.systemId,
							activated: true,
						})
					);
				});

				it('should create erwin identifier for the user', async () => {
					const { system, externalSchool, externalUser, savedUser } = setup();

					await sut.provisionEntity(ProvisioningEntityType.USER, system, { externalSchool, externalUser });

					expect(erwinIdentifierServiceMock.createErwinIdentifier).toHaveBeenCalledWith({
						erwinId: externalUser.erwinId,
						type: ReferencedEntityType.USER,
						referencedEntityId: savedUser.id,
					});
				});
			});

			describe('when creating user without school found', () => {
				const setup = () => {
					const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
					const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build();
					const externalUser: ExternalUserDto = externalUserDtoFactory.build({
						erwinId: new ObjectId().toHexString(),
						roles: [RoleName.STUDENT],
					});

					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);
					userServiceMock.findByExternalId.mockResolvedValueOnce(null);
					schoolServiceMock.getSchools.mockResolvedValueOnce([]);

					return { system, externalSchool, externalUser };
				};

				it('should throw SchoolMissingLoggableException', async () => {
					const { system, externalSchool, externalUser } = setup();

					await expect(
						sut.provisionEntity(ProvisioningEntityType.USER, system, { externalSchool, externalUser })
					).rejects.toThrow();
				});
			});

			describe('when creating user without valid roles', () => {
				const setup = () => {
					const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
					const school = schoolFactory.build();
					const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
						externalId: school.externalId,
					});
					const externalUser: ExternalUserDto = externalUserDtoFactory.build({
						erwinId: new ObjectId().toHexString(),
						roles: [],
					});

					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);
					userServiceMock.findByExternalId.mockResolvedValueOnce(null);
					schoolServiceMock.getSchools.mockResolvedValueOnce([school]);
					roleServiceMock.findByNames.mockResolvedValueOnce([]);

					return { system, externalSchool, externalUser };
				};

				it('should throw UserRoleUnknownLoggableException', async () => {
					const { system, externalSchool, externalUser } = setup();

					await expect(
						sut.provisionEntity(ProvisioningEntityType.USER, system, { externalSchool, externalUser })
					).rejects.toThrow();
				});
			});

			describe('when externalUser or externalSchool is not provided', () => {
				it('should throw an error when externalUser is missing', async () => {
					const system = provisioningSystemDtoFactory.build();
					const externalSchool = externalSchoolDtoFactory.build();

					await expect(sut.provisionEntity(ProvisioningEntityType.USER, system, { externalSchool })).rejects.toThrow(
						BadDataLoggableException
					);
				});

				it('should throw an error when externalSchool is missing', async () => {
					const system = provisioningSystemDtoFactory.build();
					const externalUser = externalUserDtoFactory.build();

					await expect(sut.provisionEntity(ProvisioningEntityType.USER, system, { externalUser })).rejects.toThrow(
						BadDataLoggableException
					);
				});
			});

			describe('when erwinId references a non-user entity', () => {
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
					const schoolErwinIdentifier = erwinIdentifierFactoryWithSchool.build({
						erwinId: externalUser.erwinId,
					});
					const savedUser = userDoFactory.buildWithId({
						firstName: externalUser.firstName,
						lastName: externalUser.lastName,
						email: externalUser.email,
						schoolId: school.id,
					});
					const roleDto: RoleDto = {
						id: new ObjectId().toHexString(),
						name: RoleName.STUDENT,
						permissions: [],
					};

					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(schoolErwinIdentifier);
					userServiceMock.findByExternalId.mockResolvedValueOnce(null);
					schoolServiceMock.getSchools.mockResolvedValueOnce([school]);
					roleServiceMock.findByNames.mockResolvedValueOnce([roleDto]);
					userServiceMock.save.mockResolvedValueOnce(savedUser);

					return { system, externalSchool, externalUser, savedUser };
				};

				it('should create new user when erwinId references wrong entity type', async () => {
					const { system, externalSchool, externalUser, savedUser } = setup();

					const result = await sut.provisionEntity(ProvisioningEntityType.USER, system, {
						externalSchool,
						externalUser,
					});

					expect(result).toEqual(savedUser);
				});
			});
		});

		describe('when entity type is CLASS', () => {
			it('should throw error for CLASS provisioning not yet implemented', async () => {
				const system = provisioningSystemDtoFactory.build();
				const externalSchool = externalSchoolDtoFactory.build();

				await expect(sut.provisionEntity(ProvisioningEntityType.CLASS, system, { externalSchool })).rejects.toThrow(
					'No handler registered for entity type: CLASS'
				);
			});
		});

		describe('when entity type is unknown', () => {
			it('should throw error for unknown entity type', async () => {
				const system = provisioningSystemDtoFactory.build();
				const externalSchool = externalSchoolDtoFactory.build();

				await expect(
					sut.provisionEntity('UNKNOWN' as ProvisioningEntityType, system, { externalSchool })
				).rejects.toThrow('No handler registered for entity type: UNKNOWN');
			});
		});
	});
});
