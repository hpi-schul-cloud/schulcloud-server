import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ExportApiInterface, RobjExportSchule, TspClientFactory } from '@infra/tsp-client';
import { School, SchoolService } from '@modules/school';
import { SystemService, SystemType } from '@modules/system';
import { Test, TestingModule } from '@nestjs/testing';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { federalStateFactory, schoolYearFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { FederalStateService, SchoolYearService } from '@src/modules/legacy-school';
import { SchoolProps } from '@src/modules/school/domain';
import { FederalStateEntityMapper, SchoolYearEntityMapper } from '@src/modules/school/repo/mikro-orm/mapper';
import { schoolFactory } from '@src/modules/school/testing';
import { systemFactory } from '@src/modules/system/testing';
import { AxiosResponse } from 'axios';
import { TspSyncService } from './tsp-sync.service';

describe(TspSyncService.name, () => {
	let module: TestingModule;
	let sut: TspSyncService;
	let tspClientFactory: DeepMocked<TspClientFactory>;
	let systemService: DeepMocked<SystemService>;
	let schoolService: DeepMocked<SchoolService>;
	let federalStateService: DeepMocked<FederalStateService>;
	let schoolYearService: DeepMocked<SchoolYearService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TspSyncService,
				{
					provide: TspClientFactory,
					useValue: createMock<TspClientFactory>(),
				},
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
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
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		sut = module.get(TspSyncService);
		tspClientFactory = module.get(TspClientFactory);
		systemService = module.get(SystemService);
		schoolService = module.get(SchoolService);
		federalStateService = module.get(FederalStateService);
		schoolYearService = module.get(SchoolYearService);
	});

	afterEach(() => {
		jest.clearAllMocks();
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

	describe('findTspSystemOrFail', () => {
		describe('when tsp system is found', () => {
			const setup = () => {
				const system = systemFactory.build({
					type: SystemType.OAUTH,
					provisioningStrategy: SystemProvisioningStrategy.TSP,
				});

				systemService.find.mockResolvedValueOnce([system]);
			};

			it('should be returned', async () => {
				setup();

				const system = await sut.findTspSystemOrFail();

				expect(system).toBeDefined();
			});
		});

		describe('when tsp system is not found', () => {
			const setup = () => {
				systemService.find.mockResolvedValueOnce([]);
			};

			it('should throw a TspSystemNotFound exception', async () => {
				setup();

				await expect(sut.findTspSystemOrFail()).rejects.toThrow();
			});
		});
	});

	describe('fetchTspSchools', () => {
		describe('when tsp schools are fetched', () => {
			const setup = () => {
				const clientId = faker.string.alpha();
				const clientSecret = faker.string.alpha();
				const tokenEndpoint = faker.internet.url();
				const system = systemFactory.build({
					oauthConfig: {
						clientId,
						clientSecret,
						tokenEndpoint,
					},
				});

				const tspSchool: RobjExportSchule = {
					schuleName: faker.string.alpha(),
					schuleNummer: faker.string.alpha(),
				};
				const schools = [tspSchool];
				const response = createMock<AxiosResponse<Array<RobjExportSchule>>>({
					data: schools,
				});

				const exportApiMock = createMock<ExportApiInterface>();
				exportApiMock.exportSchuleList.mockResolvedValueOnce(response);
				tspClientFactory.createExportClient.mockReturnValueOnce(exportApiMock);

				return { clientId, clientSecret, tokenEndpoint, system, exportApiMock, schools };
			};

			it('should use the oauthConfig to create the client', async () => {
				const { clientId, clientSecret, tokenEndpoint, system } = setup();

				await sut.fetchTspSchools(system, 1);

				expect(tspClientFactory.createExportClient).toHaveBeenCalledWith({
					clientId,
					clientSecret,
					tokenEndpoint,
				});
			});

			it('should call exportSchuleList', async () => {
				const { system, exportApiMock } = setup();

				await sut.fetchTspSchools(system, 1);

				expect(exportApiMock.exportSchuleList).toHaveBeenCalledTimes(1);
			});

			it('should return an array of schools', async () => {
				const { system } = setup();

				const schools = await sut.fetchTspSchools(system, 1);

				expect(schools).toBeDefined();
				expect(schools).toBeInstanceOf(Array);
			});
		});
	});

	describe('findSchool', () => {
		describe('when school is found', () => {
			const setup = () => {
				const externalId = faker.string.alpha();
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
				const externalId = faker.string.alpha();
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

	describe('updateSchool', () => {
		describe('when school is updated', () => {
			const setup = () => {
				const newName = faker.string.alpha();
				const oldName = faker.string.alpha();
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
				const oldName = faker.string.alpha();
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
				const name = faker.string.alpha();
				const externalId = faker.string.alpha();

				const schoolYearEntity = schoolYearFactory.build();
				const schoolYear = SchoolYearEntityMapper.mapToDo(schoolYearEntity);
				schoolYearService.getCurrentSchoolYear.mockResolvedValueOnce(schoolYearEntity);

				const federalStateEntity = federalStateFactory.build();
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
					}) as Partial<SchoolProps>,
				});
			});
		});

		describe('when federalState is already cached', () => {
			const setup = () => {
				const system = systemFactory.build();
				const name = faker.string.alpha();
				const externalId = faker.string.alpha();

				const schoolYearEntity = schoolYearFactory.build();
				const schoolYear = SchoolYearEntityMapper.mapToDo(schoolYearEntity);
				schoolYearService.getCurrentSchoolYear.mockResolvedValueOnce(schoolYearEntity);

				const federalStateEntity = federalStateFactory.build();
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
					}) as Partial<SchoolProps>,
				});
				expect(federalStateService.findFederalStateByName).not.toHaveBeenCalled();
			});
		});
	});
});
