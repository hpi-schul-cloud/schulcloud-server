import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { ErwinIdentifierService, ReferencedEntityType } from '@modules/erwin-identifier';
import { erwinIdentifierFactoryWithSchool } from '@modules/erwin-identifier/testing';
import { SchoolService, SchoolYearService } from '@modules/school';
import { schoolFactory, schoolYearEntityFactory } from '@modules/school/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalSchoolDto, ProvisioningSystemDto } from '../dto';
import { BadDataLoggableException, SchoolNameRequiredLoggableException } from '../loggable';
import { externalSchoolDtoFactory, provisioningSystemDtoFactory } from '../testing';
import { ProvisioningContext } from './erwin-provisioning-handler.interface';
import { SchoolProvisioningHandler } from './school-provisioning.handler';

describe('SchoolProvisioningHandler', () => {
	let module: TestingModule;
	let sut: SchoolProvisioningHandler;
	let schoolServiceMock: DeepMocked<SchoolService>;
	let erwinIdentifierServiceMock: DeepMocked<ErwinIdentifierService>;
	let schoolYearServiceMock: DeepMocked<SchoolYearService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolProvisioningHandler,
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
			],
		}).compile();

		sut = module.get(SchoolProvisioningHandler);
		schoolServiceMock = module.get(SchoolService);
		erwinIdentifierServiceMock = module.get(ErwinIdentifierService);
		schoolYearServiceMock = module.get(SchoolYearService);
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
		expect(sut.referencedEntityType).toBe(ReferencedEntityType.SCHOOL);
	});

	it('should have correct dtoName', () => {
		expect(sut.dtoName).toBe('ExternalSchoolDto');
	});

	describe('validate', () => {
		describe('when externalSchool is provided', () => {
			it('should not throw', () => {
				const context: ProvisioningContext = {
					system: provisioningSystemDtoFactory.build(),
					externalSchool: externalSchoolDtoFactory.build(),
				};

				expect(() => sut.validate(context)).not.toThrow();
			});
		});

		describe('when externalSchool is not provided', () => {
			it('should throw BadDataLoggableException', () => {
				const context: ProvisioningContext = {
					system: provisioningSystemDtoFactory.build(),
				};

				expect(() => sut.validate(context)).toThrow(BadDataLoggableException);
			});
		});
	});

	describe('getExternalData', () => {
		it('should return externalSchool', () => {
			const externalSchool = externalSchoolDtoFactory.build();
			const context: ProvisioningContext = {
				system: provisioningSystemDtoFactory.build(),
				externalSchool,
			};

			const result = sut.getExternalData(context);

			expect(result).toBe(externalSchool);
		});
	});

	describe('getErwinId', () => {
		describe('when externalSchool has erwinId', () => {
			it('should return erwinId', () => {
				const erwinId = new ObjectId().toHexString();
				const context: ProvisioningContext = {
					system: provisioningSystemDtoFactory.build(),
					externalSchool: externalSchoolDtoFactory.build({ erwinId }),
				};

				const result = sut.getErwinId(context);

				expect(result).toBe(erwinId);
			});
		});

		describe('when externalSchool has no erwinId', () => {
			it('should return undefined', () => {
				const context: ProvisioningContext = {
					system: provisioningSystemDtoFactory.build(),
					externalSchool: externalSchoolDtoFactory.build({ erwinId: undefined }),
				};

				const result = sut.getErwinId(context);

				expect(result).toBeUndefined();
			});
		});

		describe('when externalSchool is not provided', () => {
			it('should return undefined', () => {
				const context: ProvisioningContext = {
					system: provisioningSystemDtoFactory.build(),
				};

				const result = sut.getErwinId(context);

				expect(result).toBeUndefined();
			});
		});
	});

	describe('findByEntityId', () => {
		it('should call schoolService.getSchoolById', async () => {
			const entityId = new ObjectId().toHexString();
			const school = schoolFactory.build();
			schoolServiceMock.getSchoolById.mockResolvedValueOnce(school);

			const result = await sut.findByEntityId(entityId);

			expect(schoolServiceMock.getSchoolById).toHaveBeenCalledWith(entityId);
			expect(result).toBe(school);
		});
	});

	describe('findByExternalId', () => {
		const setup = () => {
			const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
			const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build();
			const context: ProvisioningContext = { system, externalSchool };

			return { context, system, externalSchool };
		};

		describe('when school is found', () => {
			it('should return the school', async () => {
				const { context, system, externalSchool } = setup();
				const school = schoolFactory.build();
				schoolServiceMock.getSchools.mockResolvedValueOnce([school]);

				const result = await sut.findByExternalId(context);

				expect(schoolServiceMock.getSchools).toHaveBeenCalledWith({
					systemId: system.systemId,
					externalId: externalSchool.externalId,
				});
				expect(result).toBe(school);
			});
		});

		describe('when no school is found', () => {
			it('should return null', async () => {
				const { context } = setup();
				schoolServiceMock.getSchools.mockResolvedValueOnce([]);

				const result = await sut.findByExternalId(context);

				expect(result).toBeNull();
			});
		});
	});

	describe('create', () => {
		describe('when creating a new school', () => {
			const setup = () => {
				const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
					erwinId: new ObjectId().toHexString(),
					name: faker.company.name(),
					officialSchoolNumber: faker.string.numeric(5),
				});
				const context: ProvisioningContext = { system, externalSchool };
				const schoolYear = schoolYearEntityFactory.build();
				const savedSchool = schoolFactory.build({
					name: externalSchool.name,
					externalId: externalSchool.externalId,
				});

				schoolYearServiceMock.getCurrentSchoolYear.mockResolvedValueOnce(schoolYear);
				schoolServiceMock.save.mockResolvedValueOnce(savedSchool);
				erwinIdentifierServiceMock.findByErwinId.mockResolvedValueOnce(null);
				erwinIdentifierServiceMock.createErwinIdentifier.mockResolvedValueOnce(
					erwinIdentifierFactoryWithSchool.build()
				);

				return { context, externalSchool, savedSchool };
			};

			it('should return saved school', async () => {
				const { context, savedSchool } = setup();

				const result = await sut.create(context);

				expect(result).toBe(savedSchool);
			});

			it('should save school with correct properties', async () => {
				const { context, externalSchool } = setup();

				await sut.create(context);

				const savedSchool = schoolServiceMock.save.mock.calls[0][0];
				expect(savedSchool.getInfo().name).toBe(externalSchool.name);
				expect(savedSchool.externalId).toBe(externalSchool.externalId);
				expect(savedSchool.officialSchoolNumber).toBe(externalSchool.officialSchoolNumber);
			});

			it('should create erwin identifier', async () => {
				const { context, externalSchool, savedSchool } = setup();

				await sut.create(context);

				expect(erwinIdentifierServiceMock.createErwinIdentifier).toHaveBeenCalledWith({
					erwinId: externalSchool.erwinId,
					type: ReferencedEntityType.SCHOOL,
					referencedEntityId: savedSchool.id,
				});
			});
		});

		describe('when creating a school with location', () => {
			const setup = () => {
				const schoolName = faker.company.name();
				const location = faker.location.city();
				const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
					name: schoolName,
					location,
				});
				const context: ProvisioningContext = { system, externalSchool };
				const schoolYear = schoolYearEntityFactory.build();
				const savedSchool = schoolFactory.build();

				schoolYearServiceMock.getCurrentSchoolYear.mockResolvedValueOnce(schoolYear);
				schoolServiceMock.save.mockResolvedValueOnce(savedSchool);

				return { context, schoolName, location };
			};

			it('should format name with location', async () => {
				const { context, schoolName, location } = setup();

				await sut.create(context);

				const savedSchool = schoolServiceMock.save.mock.calls[0][0];
				expect(savedSchool.getInfo().name).toBe(`${schoolName} (${location})`);
			});
		});

		describe('when creating a school without name', () => {
			const setup = () => {
				const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
					name: undefined,
				});
				const context: ProvisioningContext = { system, externalSchool };
				const schoolYear = schoolYearEntityFactory.build();

				schoolYearServiceMock.getCurrentSchoolYear.mockResolvedValueOnce(schoolYear);

				return { context };
			};

			it('should throw SchoolNameRequiredLoggableException', async () => {
				const { context } = setup();

				await expect(sut.create(context)).rejects.toThrow(SchoolNameRequiredLoggableException);
			});
		});

		describe('when creating a school without erwinId', () => {
			const setup = () => {
				const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
					erwinId: undefined,
					name: faker.company.name(),
				});
				const context: ProvisioningContext = { system, externalSchool };
				const schoolYear = schoolYearEntityFactory.build();
				const savedSchool = schoolFactory.build();

				schoolYearServiceMock.getCurrentSchoolYear.mockResolvedValueOnce(schoolYear);
				schoolServiceMock.save.mockResolvedValueOnce(savedSchool);

				return { context };
			};

			it('should not create erwin identifier', async () => {
				const { context } = setup();

				await sut.create(context);

				expect(erwinIdentifierServiceMock.createErwinIdentifier).not.toHaveBeenCalled();
			});
		});

		describe('when erwin identifier already exists', () => {
			const setup = () => {
				const system: ProvisioningSystemDto = provisioningSystemDtoFactory.build();
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
					erwinId: new ObjectId().toHexString(),
					name: faker.company.name(),
				});
				const context: ProvisioningContext = { system, externalSchool };
				const schoolYear = schoolYearEntityFactory.build();
				const savedSchool = schoolFactory.build();
				const existingIdentifier = erwinIdentifierFactoryWithSchool.build();

				schoolYearServiceMock.getCurrentSchoolYear.mockResolvedValueOnce(schoolYear);
				schoolServiceMock.save.mockResolvedValueOnce(savedSchool);
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
		describe('when updating a school', () => {
			const setup = () => {
				const school = schoolFactory.build();
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
					name: faker.company.name(),
					officialSchoolNumber: faker.string.numeric(5),
				});
				const updatedSchool = schoolFactory.build({ name: externalSchool.name });

				schoolServiceMock.save.mockResolvedValueOnce(updatedSchool);

				return { school, externalSchool, updatedSchool };
			};

			it('should return updated school', async () => {
				const { school, externalSchool, updatedSchool } = setup();

				const result = await sut.update(school, externalSchool);

				expect(result).toBe(updatedSchool);
			});

			it('should update school name', async () => {
				const { school, externalSchool } = setup();

				await sut.update(school, externalSchool);

				const savedSchool = schoolServiceMock.save.mock.calls[0][0];
				expect(savedSchool.getInfo().name).toBe(externalSchool.name);
			});

			it('should save school', async () => {
				const { school, externalSchool } = setup();

				await sut.update(school, externalSchool);

				expect(schoolServiceMock.save).toHaveBeenCalledWith(school);
			});
		});

		describe('when updating a school with location', () => {
			it('should format name with location', async () => {
				const schoolName = faker.company.name();
				const location = faker.location.city();
				const school = schoolFactory.build();
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
					name: schoolName,
					location,
				});
				schoolServiceMock.save.mockResolvedValueOnce(school);

				await sut.update(school, externalSchool);

				const savedSchool = schoolServiceMock.save.mock.calls[0][0];
				expect(savedSchool.getInfo().name).toBe(`${schoolName} (${location})`);
			});
		});

		describe('when externalSchool has no name', () => {
			it('should not update school name', async () => {
				const originalName = faker.company.name();
				const school = schoolFactory.build({ name: originalName });
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
					name: undefined,
				});
				schoolServiceMock.save.mockResolvedValueOnce(school);

				await sut.update(school, externalSchool);

				const savedSchool = schoolServiceMock.save.mock.calls[0][0];
				expect(savedSchool.getInfo().name).toBe(originalName);
			});
		});

		describe('when school already has officialSchoolNumber', () => {
			it('should not update officialSchoolNumber', async () => {
				const existingNumber = faker.string.numeric(5);
				const school = schoolFactory.build({ officialSchoolNumber: existingNumber });
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
					name: faker.company.name(),
					officialSchoolNumber: faker.string.numeric(5),
				});
				schoolServiceMock.save.mockResolvedValueOnce(school);

				await sut.update(school, externalSchool);

				expect(school.officialSchoolNumber).toBe(existingNumber);
			});
		});

		describe('when school does not have officialSchoolNumber', () => {
			it('should update officialSchoolNumber', async () => {
				const school = schoolFactory.build({ officialSchoolNumber: undefined });
				const externalSchool: ExternalSchoolDto = externalSchoolDtoFactory.build({
					name: faker.company.name(),
					officialSchoolNumber: faker.string.numeric(5),
				});
				schoolServiceMock.save.mockResolvedValueOnce(school);

				await sut.update(school, externalSchool);

				expect(schoolServiceMock.save).toHaveBeenCalled();
			});
		});
	});
});
