import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { School, SchoolService } from '@modules/school';
import { FederalStateService, FileStorageType, SchoolProps, SchoolYearService } from '@modules/school/domain';
import { FederalStateEntityMapper, SchoolYearEntityMapper } from '@modules/school/repo';
import { federalStateEntityFactory, schoolFactory, schoolYearEntityFactory } from '@modules/school/testing';
import { systemFactory } from '@modules/system/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { TspSchoolService } from './tsp-school.service';

describe(TspSchoolService.name, () => {
	let module: TestingModule;
	let sut: TspSchoolService;
	let schoolService: DeepMocked<SchoolService>;
	let federalStateService: DeepMocked<FederalStateService>;
	let schoolYearService: DeepMocked<SchoolYearService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TspSchoolService,
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: FederalStateService,
					useValue: createMock<FederalStateService>(),
				},
				{
					provide: SchoolYearService,
					useValue: createMock<SchoolYearService>(),
				},
			],
		}).compile();

		sut = module.get(TspSchoolService);
		schoolService = module.get(SchoolService);
		federalStateService = module.get(FederalStateService);
		schoolYearService = module.get(SchoolYearService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when sync service is initialized', () => {
		it('should be defined', () => {
			expect(sut).toBeDefined();
		});
	});

	describe('findSchool', () => {
		describe('when school is found', () => {
			const setup = () => {
				const externalId = faker.string.uuid();
				const system = systemFactory.build();
				const school = schoolFactory.build();

				schoolService.getSchools.mockResolvedValueOnce([school]);

				return { externalId, system };
			};

			it('should return the school', async () => {
				const { externalId, system } = setup();

				const result = await sut.findSchool(system, externalId);

				expect(result).toBeInstanceOf(School);
			});
		});

		describe('when school is not found', () => {
			const setup = () => {
				const externalId = faker.string.uuid();
				const system = systemFactory.build();

				schoolService.getSchools.mockResolvedValueOnce([]);

				return { externalId, system };
			};

			it('should return undefined', async () => {
				const { externalId, system } = setup();

				const result = await sut.findSchool(system, externalId);

				expect(result).toBeUndefined();
			});
		});
	});

	describe('findAllSchoolsForSystem', () => {
		describe('when findSchoolsForSystem is called', () => {
			const setup = () => {
				const system = systemFactory.build();
				const school = schoolFactory.build();

				schoolService.getSchools.mockResolvedValueOnce([school]);

				return { system, school };
			};

			it('should return an array of schools', async () => {
				const { system, school } = setup();

				const schools = await sut.findAllSchoolsForSystem(system);

				expect(schools).toEqual([school]);
			});
		});
	});

	describe('updateSchool', () => {
		describe('when school is updated', () => {
			const setup = () => {
				const newName = faker.person.fullName();
				const oldName = faker.person.fullName();
				const school = schoolFactory.build({
					name: oldName,
				});

				return { newName, school };
			};

			it('should set the new name', async () => {
				const { newName, school } = setup();

				await sut.updateSchool(school, newName);

				expect(schoolService.save).toHaveBeenCalledWith({
					props: expect.objectContaining<Partial<SchoolProps>>({
						name: newName,
					}) as Partial<SchoolProps>,
				});
			});
		});

		describe('when school name is undefined', () => {
			const setup = () => {
				const newName = undefined;
				const oldName = faker.person.fullName();
				const school = schoolFactory.build({
					name: oldName,
				});

				return { newName, school };
			};

			it('should not update school', async () => {
				const { newName, school } = setup();

				await sut.updateSchool(school, newName);

				expect(schoolService.save).not.toHaveBeenCalled();
			});
		});
	});

	describe('createSchool', () => {
		describe('when school is created', () => {
			const setup = () => {
				const system = systemFactory.build();
				const name = faker.word.noun();
				const externalId = faker.string.uuid();

				const schoolYearEntity = schoolYearEntityFactory.build();
				const schoolYear = SchoolYearEntityMapper.mapToDo(schoolYearEntity);
				schoolYearService.getCurrentSchoolYear.mockResolvedValueOnce(schoolYearEntity);

				const federalStateEntity = federalStateEntityFactory.build();
				const federalState = FederalStateEntityMapper.mapToDo(federalStateEntity);
				federalStateService.findFederalStateByName.mockResolvedValueOnce(federalStateEntity);

				schoolService.save.mockResolvedValueOnce(schoolFactory.build());

				return { system, name, externalId, schoolYear, federalState };
			};

			it('should be returned', async () => {
				const { system, name, externalId, schoolYear, federalState } = setup();

				const school = await sut.createSchool(system, externalId, name);

				expect(school).toBeDefined();
				expect(schoolService.save).toHaveBeenCalledWith({
					props: expect.objectContaining<Partial<SchoolProps>>({
						name,
						externalId,
						systemIds: [system.id],
						federalState,
						currentYear: schoolYear,
						fileStorageType: FileStorageType.AWS_S3,
					}) as Partial<SchoolProps>,
				});
			});
		});

		describe('when federalState is already cached', () => {
			const setup = () => {
				const system = systemFactory.build();
				const name = faker.word.noun();
				const externalId = faker.string.uuid();

				const schoolYearEntity = schoolYearEntityFactory.build();
				const schoolYear = SchoolYearEntityMapper.mapToDo(schoolYearEntity);
				schoolYearService.getCurrentSchoolYear.mockResolvedValueOnce(schoolYearEntity);

				const federalStateEntity = federalStateEntityFactory.build();
				const federalState = FederalStateEntityMapper.mapToDo(federalStateEntity);
				Reflect.set(sut, 'federalState', federalState);

				schoolService.save.mockResolvedValueOnce(schoolFactory.build());

				return { system, name, externalId, schoolYear, federalState };
			};

			it('should be used and not loaded again', async () => {
				const { system, name, externalId, schoolYear, federalState } = setup();

				const school = await sut.createSchool(system, externalId, name);

				expect(school).toBeDefined();
				expect(schoolService.save).toHaveBeenCalledWith({
					props: expect.objectContaining<Partial<SchoolProps>>({
						name,
						externalId,
						systemIds: [system.id],
						federalState,
						currentYear: schoolYear,
						fileStorageType: FileStorageType.AWS_S3,
					}) as Partial<SchoolProps>,
				});
				expect(federalStateService.findFederalStateByName).not.toHaveBeenCalled();
			});
		});
	});
});
