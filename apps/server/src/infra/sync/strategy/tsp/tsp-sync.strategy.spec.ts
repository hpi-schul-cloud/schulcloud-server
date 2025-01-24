import { Logger } from '@core/logger';
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
import {
	robjExportKlasseFactory,
	robjExportLehrerFactory,
	robjExportLehrerMigrationFactory,
	robjExportSchuelerFactory,
	robjExportSchuelerMigrationFactory,
	robjExportSchuleFactory,
} from '@infra/tsp-client/testing';
import { Account } from '@modules/account';
import { OauthDataDto, ProvisioningService } from '@modules/provisioning';
import {
	externalUserDtoFactory,
	oauthDataDtoFactory,
	provisioningSystemDtoFactory,
} from '@modules/provisioning/testing';
import { School } from '@modules/school';
import { schoolFactory } from '@modules/school/testing';
import { System, SystemService, SystemType } from '@modules/system';
import { systemFactory, systemOauthConfigFactory } from '@modules/system/testing';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDO } from '@shared/domain/domainobject';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SyncStrategyTarget } from '../../sync-strategy.types';
import { TspFetchService } from './tsp-fetch.service';
import { TspLegacyMigrationService } from './tsp-legacy-migration.service';
import { TspOauthDataMapper } from './tsp-oauth-data.mapper';
import { TspSyncMigrationService } from './tsp-sync-migration.service';
import { TspSyncConfig } from './tsp-sync.config';
import { TspSchoolService } from './tsp-school.service';
import { TspSyncStrategy } from './tsp-sync.strategy';

describe(TspSyncStrategy.name, () => {
	let module: TestingModule;
	let sut: TspSyncStrategy;
	let tspSyncService: DeepMocked<TspSchoolService>;
	let tspFetchService: DeepMocked<TspFetchService>;
	let provisioningService: DeepMocked<ProvisioningService>;
	let tspOauthDataMapper: DeepMocked<TspOauthDataMapper>;
	let tspLegacyMigrationService: DeepMocked<TspLegacyMigrationService>;
	let tspSyncMigrationService: DeepMocked<TspSyncMigrationService>;
	let configService: DeepMocked<ConfigService<TspSyncConfig, true>>;
	let systemService: DeepMocked<SystemService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TspSyncStrategy,
				{
					provide: TspSchoolService,
					useValue: createMock<TspSchoolService>(),
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
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
			],
		}).compile();

		sut = module.get(TspSyncStrategy);
		tspSyncService = module.get(TspSchoolService);
		tspFetchService = module.get(TspFetchService);
		provisioningService = module.get(ProvisioningService);
		tspOauthDataMapper = module.get(TspOauthDataMapper);
		tspLegacyMigrationService = module.get(TspLegacyMigrationService);
		tspSyncMigrationService = module.get(TspSyncMigrationService);
		configService = module.get(ConfigService);
		systemService = module.get(SystemService);
	});

	afterEach(() => {
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

		tspSyncService.findSchool.mockResolvedValueOnce(params.foundSchool ?? undefined);
		tspSyncService.findAllSchoolsForSystem.mockResolvedValueOnce(params.foundSystemSchools ?? []);
		systemService.find.mockResolvedValueOnce(params.foundSystem ? [params.foundSystem] : []);

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
				const system = systemFactory.build({
					type: SystemType.OIDC,
					provisioningStrategy: SystemProvisioningStrategy.TSP,
					oauthConfig: systemOauthConfigFactory.build(),
				});

				const systemDto = provisioningSystemDtoFactory.build({
					systemId: system.id,
					provisioningStrategy: SystemProvisioningStrategy.TSP,
				});

				const externalUser = externalUserDtoFactory.build({
					externalId: faker.string.uuid(),
					roles: [],
				});

				const oauthDataDto = oauthDataDtoFactory.build({ system: systemDto, externalUser });

				const tspTeacherMigration = robjExportLehrerMigrationFactory.build();

				const tspStudentMigration = robjExportSchuelerMigrationFactory.build();

				const school = schoolFactory.build();

				const tspTeachers = robjExportLehrerFactory.build();

				const tspStudents = robjExportSchuelerFactory.build();

				const tspClasses = robjExportKlasseFactory.build();

				setupMockServices({
					fetchedClasses: [tspClasses],
					fetchedTeachers: [tspTeachers],
					fetchedStudents: [tspStudents],
					fetchedStudentMigrations: [tspStudentMigration],
					fetchedTeacherMigrations: [tspTeacherMigration],
					mappedOauthDto: [oauthDataDto],
					foundSystemSchools: [school],
					foundSystem: system,
					configValues: [1, 10, true, 10, 1, 50],
				});

				return {
					oauthDataDto,
					system,
					school,
					tspTeachers,
					tspStudents,
					tspClasses,
					tspStudentMigration,
					tspTeacherMigration,
				};
			};

			it('should find the tsp system', async () => {
				setup();

				await sut.sync();

				expect(systemService.find).toHaveBeenCalledTimes(1);
			});

			it('should migrate the legacy data', async () => {
				const { oauthDataDto } = setup();

				await sut.sync();

				expect(tspLegacyMigrationService.prepareLegacySyncDataForNewSync).toHaveBeenCalledTimes(1);
				expect(tspLegacyMigrationService.prepareLegacySyncDataForNewSync).toHaveBeenCalledWith(
					oauthDataDto.system.systemId
				);
			});

			it('should fetch the schools', async () => {
				const { system } = setup();

				await sut.sync();

				expect(tspFetchService.fetchTspSchools).toHaveBeenCalledTimes(1);
				expect(tspFetchService.fetchTspSchools).toHaveBeenCalledWith(system, 1);
			});

			it('should fetch the data', async () => {
				const { system } = setup();

				await sut.sync();

				expect(tspFetchService.fetchTspTeachers).toHaveBeenCalledTimes(1);
				expect(tspFetchService.fetchTspTeachers).toHaveBeenCalledWith(system, 10);

				expect(tspFetchService.fetchTspStudents).toHaveBeenCalledTimes(1);
				expect(tspFetchService.fetchTspStudents).toHaveBeenCalledWith(system, 10);

				expect(tspFetchService.fetchTspClasses).toHaveBeenCalledTimes(1);
				expect(tspFetchService.fetchTspClasses).toHaveBeenCalledWith(system, 10);
			});

			it('should load all schools', async () => {
				const { system } = setup();

				await sut.sync();

				expect(tspSyncService.findAllSchoolsForSystem).toHaveBeenCalledTimes(1);
				expect(tspSyncService.findAllSchoolsForSystem).toHaveBeenCalledWith(system);
			});

			it('should map to OauthDataDto', async () => {
				const { system, school, tspTeachers, tspStudents, tspClasses } = setup();

				await sut.sync();

				expect(tspOauthDataMapper.mapTspDataToOauthData).toHaveBeenCalledTimes(1);
				expect(tspOauthDataMapper.mapTspDataToOauthData).toHaveBeenCalledWith(
					system,
					[school],
					[tspTeachers],
					[tspStudents],
					[tspClasses]
				);
			});

			it('should call provisioning service with mapped OauthDataDtos', async () => {
				const { oauthDataDto } = setup();

				await sut.sync();

				expect(provisioningService.provisionData).toHaveBeenCalledTimes(1);
				expect(provisioningService.provisionData).toHaveBeenCalledWith(oauthDataDto);
			});

			describe('when feature tsp migration is enabled', () => {
				it('should fetch teacher migrations', async () => {
					const { system } = setup();

					await sut.sync();

					expect(tspFetchService.fetchTspTeacherMigrations).toHaveBeenCalledTimes(1);
					expect(tspFetchService.fetchTspTeacherMigrations).toHaveBeenCalledWith(system);
				});

				it('should fetch student migrations', async () => {
					const { system } = setup();

					await sut.sync();

					expect(tspFetchService.fetchTspStudentMigrations).toHaveBeenCalledTimes(1);
					expect(tspFetchService.fetchTspStudentMigrations).toHaveBeenCalledWith(system);
				});

				it('should call tspSyncMigrationService', async () => {
					const { system, tspStudentMigration, tspTeacherMigration } = setup();

					await sut.sync();

					expect(tspSyncMigrationService.migrateTspUsers).toHaveBeenCalledTimes(1);
					expect(tspSyncMigrationService.migrateTspUsers).toHaveBeenCalledWith(
						system,
						new Map([
							[tspStudentMigration.schuelerUidAlt, tspStudentMigration.schuelerUidNeu],
							[tspTeacherMigration.lehrerUidAlt, tspTeacherMigration.lehrerUidNeu],
						])
					);
				});
			});
		});

		describe('when tsp system is not found', () => {
			const setup = () => {
				systemService.find.mockResolvedValueOnce([]);
			};

			it('should throw a TspSystemNotFound exception', async () => {
				setup();

				await expect(sut.sync()).rejects.toThrow();
			});
		});

		describe('when school does not exist', () => {
			const setup = () => {
				const system = systemFactory.build({
					type: SystemType.OIDC,
					provisioningStrategy: SystemProvisioningStrategy.TSP,
					oauthConfig: systemOauthConfigFactory.build(),
				});

				const tspSchool = robjExportSchuleFactory.build();
				const tspSchools = [tspSchool];

				setupMockServices({
					fetchedSchools: tspSchools,
					foundSystem: system,
					configValues: [1, 10, true, 10, 1, 50],
				});

				return { system, tspSchool };
			};

			it('should create the school', async () => {
				const { system, tspSchool } = setup();

				await sut.sync();

				expect(tspSyncService.createSchool).toHaveBeenCalledTimes(1);
				expect(tspSyncService.createSchool).toHaveBeenCalledWith(system, tspSchool.schuleNummer, tspSchool.schuleName);
			});
		});

		describe('when school does exist', () => {
			const setup = () => {
				const tspSchool = robjExportSchuleFactory.build();
				const tspSchools = [tspSchool];
				const school = schoolFactory.build();

				setupMockServices({
					foundSystem: systemFactory.build({
						type: SystemType.OIDC,
						provisioningStrategy: SystemProvisioningStrategy.TSP,
						oauthConfig: systemOauthConfigFactory.build(),
					}),
					fetchedSchools: tspSchools,
					foundSchool: school,
					configValues: [1, 10, true, 10, 1, 50],
				});

				return { school, tspSchool };
			};

			it('should update the school', async () => {
				const { school, tspSchool } = setup();

				await sut.sync();

				expect(tspSyncService.updateSchool).toHaveBeenCalledTimes(1);
				expect(tspSyncService.updateSchool).toHaveBeenCalledWith(school, tspSchool.schuleName);
			});
		});

		describe('when tsp school does not have a schulnummer', () => {
			const setup = () => {
				const tspSchool = robjExportSchuleFactory.build();
				tspSchool.schuleNummer = undefined;
				const tspSchools = [tspSchool];

				setupMockServices({
					foundSystem: systemFactory.build({
						type: SystemType.OIDC,
						provisioningStrategy: SystemProvisioningStrategy.TSP,
						oauthConfig: systemOauthConfigFactory.build(),
					}),
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
