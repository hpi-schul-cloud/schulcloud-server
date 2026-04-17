import { Logger } from '@core/logger/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { ErwinIdentifierService, ReferencedEntityType } from '@modules/erwin-identifier';
import { erwinIdentifierFactoryWithSchool } from '@modules/erwin-identifier/domain/testing';
import { SchoolService } from '@modules/school';
import { SchoolYearService } from '@modules/school/domain';
import { schoolFactory, schoolYearEntityFactory } from '@modules/school/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalSchoolDto, ProvisioningSystemDto } from '../dto';
import { SchoolNameRequiredLoggableException } from '../loggable';
import { ExternalIdMissingLoggableException } from '../loggable/external-id-missing.loggable-exception';
import { externalSchoolDtoFactory, provisioningSystemDtoFactory } from '../testing';
import { ErwinProvisioningService } from './erwin-provisioning.service';

describe('ErwinProvisioningService', () => {
	let module: TestingModule;
	let sut: ErwinProvisioningService;
	let schoolServiceMock: DeepMocked<SchoolService>;
	let erwinIdentifierServiceMock: DeepMocked<ErwinIdentifierService>;
	let schoolYearServiceMock: DeepMocked<SchoolYearService>;

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
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		sut = module.get(ErwinProvisioningService);
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

	describe('provisionSchool', () => {
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

				const result = await sut.provisionSchool(system, externalSchool);

				expect(result).toEqual(updatedSchool);
			});

			it('should save school', async () => {
				const { system, externalSchool } = setup();

				await sut.provisionSchool(system, externalSchool);

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

				const result = await sut.provisionSchool(system, externalSchool);

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

				await expect(sut.provisionSchool(system, externalSchool)).rejects.toThrow(ExternalIdMissingLoggableException);
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

				const result = await sut.provisionSchool(system, externalSchool);

				expect(result).toEqual(updatedSchool);
			});

			it('should create Erwin identifier', async () => {
				const { system, externalSchool, updatedSchool } = setup();

				await sut.provisionSchool(system, externalSchool);

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

				await sut.provisionSchool(system, externalSchool);

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

				const result = await sut.provisionSchool(system, externalSchool);

				expect(result).toEqual(newSchool);
			});

			it('should create erwin identifier', async () => {
				const { system, externalSchool, newSchool } = setup();

				await sut.provisionSchool(system, externalSchool);

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

				const result = await sut.provisionSchool(system, externalSchool);

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

				await expect(sut.provisionSchool(system, externalSchool)).rejects.toThrow(SchoolNameRequiredLoggableException);
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

				const result = await sut.provisionSchool(system, externalSchool);

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

				await sut.provisionSchool(system, externalSchool);

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

				const result = await sut.provisionSchool(system, externalSchool);

				expect(result).toEqual(newSchool);
				expect(erwinIdentifierServiceMock.createErwinIdentifier).not.toHaveBeenCalled();
			});
		});
	});
});
