import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { RobjExportSchule } from '@infra/tsp-client';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@src/core/logger';
import { ProvisioningService } from '@src/modules/provisioning';
import { schoolFactory } from '@src/modules/school/testing';
import { SyncStrategyTarget } from '../sync-strategy.types';
import { TspSyncConfig } from './tsp-sync.config';
import { TspSyncService } from './tsp-sync.service';
import { TspSyncStrategy } from './tsp-sync.strategy';

describe(TspSyncStrategy.name, () => {
	let module: TestingModule;
	let sut: TspSyncStrategy;
	let tspSyncService: DeepMocked<TspSyncService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TspSyncStrategy,
				{
					provide: TspSyncService,
					useValue: createMock<TspSyncService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<TspSyncConfig, true>>({
						getOrThrow: (key: string) => {
							switch (key) {
								case 'TSP_SYNC_SCHOOL_LIMIT':
									return 10;
								case 'TSP_SYNC_SCHOOL_DAYS_TO_FETCH':
									return 1;
								case 'TSP_SYNC_DATA_LIMIT':
									return 10;
								case 'TSP_SYNC_DATA_DAYS_TO_FETCH':
									return 1;
								default:
									throw new Error(`Unknown key: ${key}`);
							}
						},
					}),
				},
				{
					provide: ProvisioningService,
					useValue: createMock<ProvisioningService>(),
				},
			],
		}).compile();

		sut = module.get(TspSyncStrategy);
		tspSyncService = module.get(TspSyncService);
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when tsp sync strategy is initialized', () => {
		it('should be defined', () => {
			expect(sut).toBeDefined();
		});
	});

	describe('getType', () => {
		describe('when tsp sync strategy is initialized', () => {
			it('should return tsp', () => {
				expect(sut.getType()).toBe(SyncStrategyTarget.TSP);
			});
		});
	});

	describe('sync', () => {
		describe('when sync is called', () => {
			const setup = () => {
				tspSyncService.fetchTspSchools.mockResolvedValueOnce([]);
				tspSyncService.fetchTspClasses.mockResolvedValueOnce([]);
				tspSyncService.fetchTspStudents.mockResolvedValueOnce([]);
				tspSyncService.fetchTspTeachers.mockResolvedValueOnce([]);
				tspSyncService.findSchoolsForSystem.mockResolvedValueOnce([]);
				tspSyncService.mapTspDataToOauthData.mockReturnValueOnce([]);
			};

			it('should find the tsp system', async () => {
				await sut.sync();

				expect(tspSyncService.findTspSystemOrFail).toHaveBeenCalled();
			});

			it('should fetch the schools', async () => {
				setup();

				await sut.sync();

				expect(tspSyncService.fetchTspSchools).toHaveBeenCalled();
			});
		});

		describe('when school does not exist', () => {
			const setup = () => {
				const tspSchool: RobjExportSchule = {
					schuleNummer: faker.string.alpha(),
					schuleName: faker.string.alpha(),
				};
				const tspSchools = [tspSchool];
				tspSyncService.fetchTspSchools.mockResolvedValueOnce(tspSchools);

				tspSyncService.findSchool.mockResolvedValueOnce(undefined);
			};

			it('should create the school', async () => {
				setup();

				await sut.sync();

				expect(tspSyncService.createSchool).toHaveBeenCalled();
			});
		});

		describe('when school does exist', () => {
			const setup = () => {
				const tspSchool: RobjExportSchule = {
					schuleNummer: faker.string.alpha(),
					schuleName: faker.string.alpha(),
				};
				const tspSchools = [tspSchool];
				tspSyncService.fetchTspSchools.mockResolvedValueOnce(tspSchools);

				const school = schoolFactory.build();
				tspSyncService.findSchool.mockResolvedValueOnce(school);
			};

			it('should update the school', async () => {
				setup();

				await sut.sync();

				expect(tspSyncService.updateSchool).toHaveBeenCalled();
			});
		});

		describe('when tsp school does not have a schulnummer', () => {
			const setup = () => {
				const tspSchool: RobjExportSchule = {
					schuleNummer: undefined,
					schuleName: faker.string.alpha(),
				};
				const tspSchools = [tspSchool];
				tspSyncService.fetchTspSchools.mockResolvedValueOnce(tspSchools);
			};

			it('should skip the school', async () => {
				setup();

				await sut.sync();

				expect(tspSyncService.findSchool).not.toHaveBeenCalled();
				expect(tspSyncService.updateSchool).not.toHaveBeenCalled();
				expect(tspSyncService.createSchool).not.toHaveBeenCalled();
			});
		});
	});
});
