import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import {
	RobjExportKlasse,
	RobjExportLehrer,
	RobjExportLehrerMigration,
	RobjExportSchueler,
	RobjExportSchuelerMigration,
	RobjExportSchule,
} from '@infra/tsp-client';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDO } from '@shared/domain/domainobject';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';

import { Logger } from '@src/core/logger';
import { robjExportSchuleFactory } from '@src/infra/tsp-client/testing';
import { Account } from '@src/modules/account';
import { OauthDataDto, ProvisioningService } from '@src/modules/provisioning';
import {
	externalUserDtoFactory,
	oauthDataDtoFactory,
	provisioningSystemDtoFactory,
} from '@src/modules/provisioning/testing';
import { School } from '@src/modules/school';
import { schoolFactory } from '@src/modules/school/testing';
import { System } from '@src/modules/system';
import { systemFactory } from '@src/modules/system/testing';
import { SyncStrategyTarget } from '../sync-strategy.types';
import { TspFetchService } from './tsp-fetch.service';
import { TspLegacyMigrationService } from './tsp-legacy-migration.service';
import { TspOauthDataMapper } from './tsp-oauth-data.mapper';
import { TspSyncMigrationService } from './tsp-sync-migration.service';
import { TspSyncConfig } from './tsp-sync.config';
import { TspSyncService } from './tsp-sync.service';
import { TspSyncStrategy } from './tsp-sync.strategy';

describe(TspSyncStrategy.name, () => {
	let module: TestingModule;
	let sut: TspSyncStrategy;
	let tspSyncService: DeepMocked<TspSyncService>;
	let tspFetchService: DeepMocked<TspFetchService>;
	let provisioningService: DeepMocked<ProvisioningService>;
	let tspOauthDataMapper: DeepMocked<TspOauthDataMapper>;
	let tspLegacyMigrationService: DeepMocked<TspLegacyMigrationService>;
	let tspSyncMigrationService: DeepMocked<TspSyncMigrationService>;
	let configService: DeepMocked<ConfigService<TspSyncConfig, true>>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TspSyncStrategy,
				{
					provide: TspSyncService,
					useValue: createMock<TspSyncService>(),
				},
				{
					provide: TspFetchService,
					useValue: createMock<TspFetchService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<TspSyncConfig, true>>(),
				},
				{
					provide: ProvisioningService,
					useValue: createMock<ProvisioningService>(),
				},
				{
					provide: TspOauthDataMapper,
					useValue: createMock<TspOauthDataMapper>(),
				},
				{
					provide: TspLegacyMigrationService,
					useValue: createMock<TspLegacyMigrationService>(),
				},
				{
					provide: TspSyncMigrationService,
					useValue: createMock<TspSyncMigrationService>(),
				},
			],
		}).compile();

		sut = module.get(TspSyncStrategy);
		tspSyncService = module.get(TspSyncService);
		tspFetchService = module.get(TspFetchService);
		provisioningService = module.get(ProvisioningService);
		tspOauthDataMapper = module.get(TspOauthDataMapper);
		tspLegacyMigrationService = module.get(TspLegacyMigrationService);
		tspSyncMigrationService = module.get(TspSyncMigrationService);
		configService = module.get(ConfigService);
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.resetAllMocks();
		jest.restoreAllMocks();
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

	const setupMockServices = (params: {
		fetchedSchools?: RobjExportSchule[];
		fetchedClasses?: RobjExportKlasse[];
		fetchedTeachers?: RobjExportLehrer[];
		fetchedStudents?: RobjExportSchueler[];
		fetchedTeacherMigrations?: RobjExportLehrerMigration[];
		fetchedStudentMigrations?: RobjExportSchuelerMigration[];
		foundSchool?: School;
		foundSystemSchools?: School[];
		foundTspUidUser?: UserDO | null;
		foundTspUidAccount?: Account | null;
		mappedOauthDto?: OauthDataDto[];
		foundSystem?: System;
		updatedAccount?: Account;
		updatedUser?: UserDO;
		configValues?: unknown[];
		migrationResult?: {
			totalAmount: number;
			totalUsers: number;
			totalAccounts: number;
		};
	}) => {
		tspFetchService.fetchTspSchools.mockResolvedValueOnce(params.fetchedSchools ?? []);
		tspFetchService.fetchTspClasses.mockResolvedValueOnce(params.fetchedClasses ?? []);
		tspFetchService.fetchTspStudents.mockResolvedValueOnce(params.fetchedStudents ?? []);
		tspFetchService.fetchTspTeachers.mockResolvedValueOnce(params.fetchedTeachers ?? []);
		tspFetchService.fetchTspTeacherMigrations.mockResolvedValueOnce(params.fetchedTeacherMigrations ?? []);
		tspFetchService.fetchTspStudentMigrations.mockResolvedValueOnce(params.fetchedStudentMigrations ?? []);

		tspSyncService.findSchool.mockResolvedValue(params.foundSchool ?? undefined);
		tspSyncService.findSchoolsForSystem.mockResolvedValueOnce(params.foundSystemSchools ?? []);
		tspSyncService.findTspSystemOrFail.mockResolvedValueOnce(params.foundSystem ?? systemFactory.build());

		tspOauthDataMapper.mapTspDataToOauthData.mockReturnValueOnce(params.mappedOauthDto ?? []);

		params.configValues?.forEach((value) => configService.getOrThrow.mockReturnValueOnce(value));

		tspSyncMigrationService.migrateTspUsers.mockResolvedValueOnce(
			params.migrationResult ?? {
				totalAccounts: faker.number.int(),
				totalAmount: faker.number.int(),
				totalUsers: faker.number.int(),
			}
		);
	};

	describe('sync', () => {
		describe('when sync is called', () => {
			const setup = () => {
				const oauthDataDto = oauthDataDtoFactory.build({
					system: provisioningSystemDtoFactory.build({
						systemId: faker.string.alpha(),
						provisioningStrategy: SystemProvisioningStrategy.TSP,
					}),
					externalUser: externalUserDtoFactory.build({
						externalId: faker.string.alpha(),
						roles: [],
					}),
				});
				const tspTeacher: RobjExportLehrerMigration = {
					lehrerUidAlt: faker.string.alpha(),
					lehrerUidNeu: faker.string.alpha(),
				};

				const tspStudent: RobjExportSchuelerMigration = {
					schuelerUidAlt: faker.string.alpha(),
					schuelerUidNeu: faker.string.alpha(),
				};

				setupMockServices({
					fetchedStudentMigrations: [tspStudent],
					fetchedTeacherMigrations: [tspTeacher],
					mappedOauthDto: [oauthDataDto],
					configValues: [1, 10, true, 10, 1, 50],
				});

				return { oauthDataDto };
			};

			it('should find the tsp system', async () => {
				setup();

				await sut.sync();

				expect(tspSyncService.findTspSystemOrFail).toHaveBeenCalled();
			});

			it('should migrate the legacy data', async () => {
				setup();

				await sut.sync();

				expect(tspLegacyMigrationService.migrateLegacyData).toHaveBeenCalled();
			});

			it('should fetch the schools', async () => {
				setup();

				await sut.sync();

				expect(tspFetchService.fetchTspSchools).toHaveBeenCalled();
			});

			it('should fetch the data', async () => {
				setup();

				await sut.sync();

				expect(tspFetchService.fetchTspTeachers).toHaveBeenCalled();
				expect(tspFetchService.fetchTspStudents).toHaveBeenCalled();
				expect(tspFetchService.fetchTspClasses).toHaveBeenCalled();
			});

			it('should load all schools', async () => {
				setup();

				await sut.sync();

				expect(tspSyncService.findSchoolsForSystem).toHaveBeenCalled();
			});

			it('should map to OauthDataDto', async () => {
				setup();

				await sut.sync();

				expect(tspOauthDataMapper.mapTspDataToOauthData).toHaveBeenCalled();
			});

			it('should call provisioning service with mapped OauthDataDtos', async () => {
				const { oauthDataDto } = setup();

				await sut.sync();

				expect(provisioningService.provisionData).toHaveBeenCalledWith(oauthDataDto);
			});

			describe('when feature tsp migration is enabled', () => {
				it('should fetch teacher migrations', async () => {
					setup();

					await sut.sync();

					expect(tspFetchService.fetchTspTeacherMigrations).toHaveBeenCalled();
				});

				it('should fetch student migrations', async () => {
					setup();

					await sut.sync();

					expect(tspFetchService.fetchTspStudentMigrations).toHaveBeenCalled();
				});

				it('should call tspSyncMigrationService', async () => {
					setup();

					await sut.sync();

					expect(tspSyncMigrationService.migrateTspUsers).toHaveBeenCalled();
				});
			});
		});

		describe('when school does not exist', () => {
			const setup = () => {
				const tspSchool = robjExportSchuleFactory.build();
				const tspSchools = [tspSchool];

				setupMockServices({
					fetchedSchools: tspSchools,
					configValues: [1, 10, true, 10, 1, 50],
				});
			};

			it('should create the school', async () => {
				setup();

				await sut.sync();

				expect(tspSyncService.createSchool).toHaveBeenCalled();
			});
		});

		describe('when school does exist', () => {
			const setup = () => {
				const tspSchool = robjExportSchuleFactory.build();
				const tspSchools = [tspSchool];
				const school = schoolFactory.build();

				setupMockServices({
					fetchedSchools: tspSchools,
					foundSchool: school,
					configValues: [1, 10, true, 10, 1, 50],
				});
			};

			it('should update the school', async () => {
				setup();

				await sut.sync();

				expect(tspSyncService.updateSchool).toHaveBeenCalled();
			});
		});

		describe('when tsp school does not have a schulnummer', () => {
			const setup = () => {
				const tspSchool = robjExportSchuleFactory.build();
				tspSchool.schuleNummer = undefined;
				const tspSchools = [tspSchool];

				setupMockServices({
					fetchedSchools: tspSchools,
					configValues: [1, 10, true, 10, 1, 50],
				});
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
