import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { ErwinIdentifierService, ReferencedEntityType } from '@modules/erwin-identifier';
import { erwinIdentifierFactoryWithSchool, erwinIdentifierFactoryWithUser } from '@modules/erwin-identifier/testing';
import { schoolFactory } from '@modules/school/testing';
import { userDoFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalSchoolDto, ExternalUserDto, ProvisioningSystemDto } from '../dto';
import { BadDataLoggableException } from '../loggable';
import { ExternalIdMissingLoggableException } from '../loggable/external-id-missing.loggable-exception';
import { externalSchoolDtoFactory, externalUserDtoFactory, provisioningSystemDtoFactory } from '../testing';
import { ErwinProvisioningService, ProvisioningEntityType } from './erwin-provisioning.service';
import { SchoolProvisioningHandler } from './school-provisioning.handler';
import { UserProvisioningHandler } from './user-provisioning.handler';

describe('ErwinProvisioningService', () => {
	let module: TestingModule;
	let sut: ErwinProvisioningService;
	let erwinIdentifierServiceMock: DeepMocked<ErwinIdentifierService>;
	let schoolProvisioningHandlerMock: DeepMocked<SchoolProvisioningHandler>;
	let userProvisioningHandlerMock: DeepMocked<UserProvisioningHandler>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ErwinProvisioningService,
				{
					provide: ErwinIdentifierService,
					useValue: createMock<ErwinIdentifierService>(),
				},
				{
					provide: SchoolProvisioningHandler,
					useValue: createMock<SchoolProvisioningHandler>(),
				},
				{
					provide: UserProvisioningHandler,
					useValue: createMock<UserProvisioningHandler>(),
				},
			],
		}).compile();

		sut = module.get(ErwinProvisioningService);
		erwinIdentifierServiceMock = module.get(ErwinIdentifierService);
		schoolProvisioningHandlerMock = module.get(SchoolProvisioningHandler);
		userProvisioningHandlerMock = module.get(UserProvisioningHandler);
	});

	beforeEach(() => {
		Object.defineProperty(schoolProvisioningHandlerMock, 'referencedEntityType', {
			value: ReferencedEntityType.SCHOOL,
			writable: true,
		});
		Object.defineProperty(schoolProvisioningHandlerMock, 'dtoName', {
			value: 'ExternalSchoolDto',
			writable: true,
		});
		Object.defineProperty(userProvisioningHandlerMock, 'referencedEntityType', {
			value: ReferencedEntityType.USER,
			writable: true,
		});
		Object.defineProperty(userProvisioningHandlerMock, 'dtoName', {
			value: 'ExternalUserDto',
			writable: true,
		});
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
					const updatedSchool = schoolFactory.build({ name: externalSchool.name });

					schoolProvisioningHandlerMock.getExternalData.mockReturnValue(externalSchool);
					schoolProvisioningHandlerMock.getErwinId.mockReturnValue(externalSchool.erwinId);
					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(erwinIdentifier);
					schoolProvisioningHandlerMock.findByEntityId.mockResolvedValueOnce(existingSchool);
					schoolProvisioningHandlerMock.update.mockResolvedValueOnce(updatedSchool);

					return { system, externalSchool, updatedSchool };
				};

				it('should return updated school', async () => {
					const { system, externalSchool, updatedSchool } = setup();

					const result = await sut.provisionEntity(ProvisioningEntityType.SCHOOL, { system, externalSchool });

					expect(result).toEqual(updatedSchool);
				});

				it('should call handler update', async () => {
					const { system, externalSchool } = setup();

					await sut.provisionEntity(ProvisioningEntityType.SCHOOL, { system, externalSchool });

					expect(schoolProvisioningHandlerMock.update).toHaveBeenCalled();
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

					schoolProvisioningHandlerMock.getExternalData.mockReturnValue(externalSchool);
					schoolProvisioningHandlerMock.getErwinId.mockReturnValue(externalSchool.erwinId);
					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(erwinIdentifier);
					schoolProvisioningHandlerMock.findByEntityId.mockResolvedValueOnce(existingSchool);

					return { system, externalSchool, existingSchool };
				};

				it('should return existing school without update', async () => {
					const { system, externalSchool, existingSchool } = setup();

					const result = await sut.provisionEntity(ProvisioningEntityType.SCHOOL, { system, externalSchool });

					expect(result).toEqual(existingSchool);
					expect(schoolProvisioningHandlerMock.update).not.toHaveBeenCalled();
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

					schoolProvisioningHandlerMock.getExternalData.mockReturnValue(externalSchool);
					schoolProvisioningHandlerMock.getErwinId.mockReturnValue(externalSchool.erwinId);
					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);

					return { system, externalSchool };
				};

				it('should throw ExternalIdMissingException', async () => {
					const { system, externalSchool } = setup();

					await expect(sut.provisionEntity(ProvisioningEntityType.SCHOOL, { system, externalSchool })).rejects.toThrow(
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
					const updatedSchool = schoolFactory.build({ name: externalSchool.name });

					schoolProvisioningHandlerMock.getExternalData.mockReturnValue(externalSchool);
					schoolProvisioningHandlerMock.getErwinId.mockReturnValue(externalSchool.erwinId);
					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);
					schoolProvisioningHandlerMock.findByExternalId.mockResolvedValueOnce(existingSchool);
					schoolProvisioningHandlerMock.update.mockResolvedValueOnce(updatedSchool);
					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);
					erwinIdentifierServiceMock.createErwinIdentifier.mockResolvedValueOnce(
						erwinIdentifierFactoryWithSchool.build()
					);

					return { system, externalSchool, updatedSchool };
				};

				it('should return updated school', async () => {
					const { system, externalSchool, updatedSchool } = setup();

					const result = await sut.provisionEntity(ProvisioningEntityType.SCHOOL, { system, externalSchool });

					expect(result).toEqual(updatedSchool);
				});

				it('should create Erwin identifier', async () => {
					const { system, externalSchool, updatedSchool } = setup();

					await sut.provisionEntity(ProvisioningEntityType.SCHOOL, { system, externalSchool });

					expect(erwinIdentifierServiceMock.createErwinIdentifier).toHaveBeenCalledWith({
						erwinId: externalSchool.erwinId,
						type: ReferencedEntityType.SCHOOL,
						referencedEntityId: updatedSchool.id,
					});
				});
			});

			describe('when updated entity does not have an id', () => {
				const setup = () => {
					const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
					const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
						erwinId: new ObjectId().toHexString(),
						name: 'Updated School Name',
					});
					const existingSchool = schoolFactory.build({
						externalId: externalSchool.externalId,
						systemIds: [system.systemId],
					});
					const updatedSchoolWithoutId = { name: externalSchool.name };

					schoolProvisioningHandlerMock.getExternalData.mockReturnValue(externalSchool);
					schoolProvisioningHandlerMock.getErwinId.mockReturnValue(externalSchool.erwinId);
					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);
					schoolProvisioningHandlerMock.findByExternalId.mockResolvedValueOnce(existingSchool);
					schoolProvisioningHandlerMock.update.mockResolvedValueOnce(updatedSchoolWithoutId as unknown as never);

					return { system, externalSchool };
				};

				it('should throw BadDataLoggableException', async () => {
					const { system, externalSchool } = setup();

					await expect(sut.provisionEntity(ProvisioningEntityType.SCHOOL, { system, externalSchool })).rejects.toThrow(
						BadDataLoggableException
					);
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
					const newSchool = schoolFactory.build({
						name: externalSchool.name,
						externalId: externalSchool.externalId,
						officialSchoolNumber: externalSchool.officialSchoolNumber,
					});

					schoolProvisioningHandlerMock.getExternalData.mockReturnValue(externalSchool);
					schoolProvisioningHandlerMock.getErwinId.mockReturnValue(externalSchool.erwinId);
					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);
					schoolProvisioningHandlerMock.findByExternalId.mockResolvedValueOnce(null);
					schoolProvisioningHandlerMock.create.mockResolvedValueOnce(newSchool);

					return { system, externalSchool, newSchool };
				};

				it('should return new school', async () => {
					const { system, externalSchool, newSchool } = setup();

					const result = await sut.provisionEntity(ProvisioningEntityType.SCHOOL, { system, externalSchool });

					expect(result).toEqual(newSchool);
				});

				it('should call handler create', async () => {
					const { system, externalSchool } = setup();

					await sut.provisionEntity(ProvisioningEntityType.SCHOOL, { system, externalSchool });

					expect(schoolProvisioningHandlerMock.create).toHaveBeenCalledWith({ system, externalSchool });
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
					const updatedSchool = schoolFactory.build({ name: externalSchool.name });
					const existingErwinIdentifier = erwinIdentifierFactoryWithSchool.build({
						erwinId: externalSchool.erwinId,
					});

					schoolProvisioningHandlerMock.getExternalData.mockReturnValue(externalSchool);
					schoolProvisioningHandlerMock.getErwinId.mockReturnValue(externalSchool.erwinId);
					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);
					schoolProvisioningHandlerMock.findByExternalId.mockResolvedValueOnce(existingSchool);
					schoolProvisioningHandlerMock.update.mockResolvedValueOnce(updatedSchool);
					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(existingErwinIdentifier);

					return { system, externalSchool, updatedSchool };
				};

				it('should not create duplicate erwin identifier', async () => {
					const { system, externalSchool, updatedSchool } = setup();

					const result = await sut.provisionEntity(ProvisioningEntityType.SCHOOL, { system, externalSchool });

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
					const newSchool = schoolFactory.build({ name: externalSchool.name });

					schoolProvisioningHandlerMock.getExternalData.mockReturnValue(externalSchool);
					schoolProvisioningHandlerMock.getErwinId.mockReturnValue(externalSchool.erwinId);
					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(userErwinIdentifier);
					schoolProvisioningHandlerMock.findByExternalId.mockResolvedValueOnce(null);
					schoolProvisioningHandlerMock.create.mockResolvedValueOnce(newSchool);

					return { system, externalSchool };
				};

				it('should create new school', async () => {
					const { system, externalSchool } = setup();

					await sut.provisionEntity(ProvisioningEntityType.SCHOOL, { system, externalSchool });

					expect(schoolProvisioningHandlerMock.create).toHaveBeenCalled();
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

					userProvisioningHandlerMock.getExternalData.mockReturnValue(externalUser);
					userProvisioningHandlerMock.getErwinId.mockReturnValue(externalUser.erwinId);
					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(erwinIdentifier);
					userProvisioningHandlerMock.findByEntityId.mockResolvedValueOnce(existingUser);
					userProvisioningHandlerMock.update.mockResolvedValueOnce(updatedUser);

					return { system, externalSchool, externalUser, updatedUser };
				};

				it('should return updated user', async () => {
					const { system, externalSchool, externalUser, updatedUser } = setup();

					const result = await sut.provisionEntity(ProvisioningEntityType.USER, {
						system,
						externalSchool,
						externalUser,
					});

					expect(result).toEqual(updatedUser);
				});

				it('should call handler update', async () => {
					const { system, externalSchool, externalUser } = setup();

					await sut.provisionEntity(ProvisioningEntityType.USER, { system, externalSchool, externalUser });

					expect(userProvisioningHandlerMock.update).toHaveBeenCalled();
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

					userProvisioningHandlerMock.getExternalData.mockReturnValue(externalUser);
					userProvisioningHandlerMock.getErwinId.mockReturnValue(externalUser.erwinId);
					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(erwinIdentifier);
					userProvisioningHandlerMock.findByEntityId.mockResolvedValueOnce(existingUser);

					return { system, externalSchool, externalUser, existingUser };
				};

				it('should return existing user without update', async () => {
					const { system, externalSchool, externalUser, existingUser } = setup();

					const result = await sut.provisionEntity(ProvisioningEntityType.USER, {
						system,
						externalSchool,
						externalUser,
					});

					expect(result).toEqual(existingUser);
					expect(userProvisioningHandlerMock.update).not.toHaveBeenCalled();
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

					userProvisioningHandlerMock.getExternalData.mockReturnValue(externalUser);
					userProvisioningHandlerMock.getErwinId.mockReturnValue(externalUser.erwinId);
					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);

					return { system, externalSchool, externalUser };
				};

				it('should throw ExternalIdMissingException', async () => {
					const { system, externalSchool, externalUser } = setup();

					await expect(
						sut.provisionEntity(ProvisioningEntityType.USER, { system, externalSchool, externalUser })
					).rejects.toThrow(ExternalIdMissingLoggableException);
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
					});
					const savedUser = userDoFactory.buildWithId({
						firstName: externalUser.firstName,
						lastName: externalUser.lastName,
						email: externalUser.email,
						schoolId: school.id,
					});

					userProvisioningHandlerMock.getExternalData.mockReturnValue(externalUser);
					userProvisioningHandlerMock.getErwinId.mockReturnValue(externalUser.erwinId);
					erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);
					userProvisioningHandlerMock.findByExternalId.mockResolvedValueOnce(null);
					userProvisioningHandlerMock.create.mockResolvedValueOnce(savedUser);

					return { system, externalSchool, externalUser, savedUser };
				};

				it('should create new user and return it', async () => {
					const { system, externalSchool, externalUser, savedUser } = setup();

					const result = await sut.provisionEntity(ProvisioningEntityType.USER, {
						system,
						externalSchool,
						externalUser,
					});

					expect(result).toEqual(savedUser);
				});

				it('should call handler create', async () => {
					const { system, externalSchool, externalUser } = setup();

					await sut.provisionEntity(ProvisioningEntityType.USER, { system, externalSchool, externalUser });

					expect(userProvisioningHandlerMock.create).toHaveBeenCalledWith({ system, externalSchool, externalUser });
				});
			});
		});

		describe('when entity type is unknown', () => {
			it('should throw BadDataLoggableException', async () => {
				const system = provisioningSystemDtoFactory.build();

				await expect(sut.provisionEntity('UNKNOWN' as ProvisioningEntityType, { system })).rejects.toThrow(
					BadDataLoggableException
				);
			});
		});
	});
});
