import { Logger } from '@core/logger';
import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { RobjExportKlasse, RobjExportLehrer, RobjExportSchueler, RobjExportSchule } from '@infra/tsp-client';
import {
	robjExportKlasseFactory,
	robjExportLehrerFactory,
	robjExportSchuelerFactory,
	robjExportSchuleFactory,
} from '@infra/tsp-client/testing';
import { Account } from '@modules/account';
import { OauthDataDto } from '@modules/provisioning';
import { BadDataLoggableException } from '@modules/provisioning/loggable';
import { TspProvisioningService } from '@modules/provisioning/service/tsp-provisioning.service';
import {
	externalSchoolDtoFactory,
	externalUserDtoFactory,
	oauthDataDtoFactory,
	provisioningSystemDtoFactory,
} from '@modules/provisioning/testing';
import { RoleName } from '@modules/role';
import { School } from '@modules/school';
import { schoolFactory } from '@modules/school/testing';
import { System, SystemService, SystemType } from '@modules/system';
import { systemFactory, systemOauthConfigFactory } from '@modules/system/testing';
import { UserDo } from '@modules/user';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SyncStrategyTarget } from '../../sync-strategy.types';
import { SYNC_CONFIG_TOKEN, SyncConfig } from '../../sync.config';
import { TspFetchService } from './tsp-fetch.service';
import { TspOauthDataMapper, TspUserInfo } from './tsp-oauth-data.mapper';
import { TspSchoolService } from './tsp-school.service';
import { TspSyncStrategy } from './tsp-sync.strategy';

describe(TspSyncStrategy.name, () => {
	let module: TestingModule;
	let sut: TspSyncStrategy;
	let tspSyncService: DeepMocked<TspSchoolService>;
	let tspFetchService: DeepMocked<TspFetchService>;
	let config: SyncConfig;
	let provisioningService: DeepMocked<TspProvisioningService>;
	let tspOauthDataMapper: DeepMocked<TspOauthDataMapper>;
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
					provide: SYNC_CONFIG_TOKEN,
					useValue: new SyncConfig(),
				},
				{
					provide: TspProvisioningService,
					useValue: createMock<TspProvisioningService>(),
				},
				{
					provide: TspOauthDataMapper,
					useValue: createMock<TspOauthDataMapper>(),
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
		config = module.get(SYNC_CONFIG_TOKEN);
		provisioningService = module.get(TspProvisioningService);
		tspOauthDataMapper = module.get(TspOauthDataMapper);
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
		foundSchool?: School;
		foundSystemSchools?: School[];
		foundTspUidUser?: UserDo | null;
		foundTspUidAccount?: Account | null;
		mappedOauthDto?: { oauthDataDtos: OauthDataDto[]; usersOfClasses: Map<string, TspUserInfo[]> };
		foundSystem?: System;
		updatedAccount?: Account;
		updatedUser?: UserDo;
		processBatchSize?: number;
		classBatchResult?: { classCreationCount: number; classUpdateCount: number };
	}) => {
		tspFetchService.fetchTspSchools.mockResolvedValueOnce(params.fetchedSchools ?? []);
		tspFetchService.fetchTspClasses.mockResolvedValueOnce(params.fetchedClasses ?? []);
		tspFetchService.fetchTspStudents.mockResolvedValueOnce(params.fetchedStudents ?? []);
		tspFetchService.fetchTspTeachers.mockResolvedValueOnce(params.fetchedTeachers ?? []);

		tspSyncService.findSchool.mockResolvedValueOnce(params.foundSchool ?? undefined);
		tspSyncService.findAllSchoolsForSystem.mockResolvedValueOnce(params.foundSystemSchools ?? []);
		systemService.find.mockResolvedValueOnce(params.foundSystem ? [params.foundSystem] : []);

		tspOauthDataMapper.mapTspDataToOauthData.mockReturnValueOnce(
			params.mappedOauthDto ?? {
				oauthDataDtos: [],
				usersOfClasses: new Map(),
			}
		);

		provisioningService.provisionUserBatch.mockResolvedValueOnce(params.processBatchSize ?? 0);
		provisioningService.provisionClassBatch.mockResolvedValueOnce(
			params.classBatchResult ?? { classCreationCount: 0, classUpdateCount: 0 }
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

				const externalSchool = externalSchoolDtoFactory.build();

				const oauthDataDto = oauthDataDtoFactory.build({ system: systemDto, externalUser, externalSchool });

				const tspSchool = robjExportSchuleFactory.build({
					schuleNummer: externalSchool.externalId,
				});

				const school = schoolFactory.build({
					externalId: tspSchool.schuleNummer,
				});

				const tspTeachers = robjExportLehrerFactory.build();

				const tspStudents = robjExportSchuelerFactory.build();

				const tspClasses = robjExportKlasseFactory.build();

				setupMockServices({
					fetchedSchools: [tspSchool],
					fetchedClasses: [tspClasses],
					fetchedTeachers: [tspTeachers],
					fetchedStudents: [tspStudents],
					mappedOauthDto: {
						oauthDataDtos: [oauthDataDto],
						usersOfClasses: new Map(),
					},
					foundSystemSchools: [school],
					foundSystem: system,
				});

				return {
					oauthDataDto,
					system,
					school,
					tspTeachers,
					tspStudents,
					tspClasses,
				};
			};

			it('should find the tsp system', async () => {
				setup();

				await sut.sync();

				expect(systemService.find).toHaveBeenCalledTimes(1);
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
				expect(tspFetchService.fetchTspTeachers).toHaveBeenCalledWith(system, config.dataDaysToFetch);

				expect(tspFetchService.fetchTspStudents).toHaveBeenCalledTimes(1);
				expect(tspFetchService.fetchTspStudents).toHaveBeenCalledWith(system, config.dataDaysToFetch);

				expect(tspFetchService.fetchTspClasses).toHaveBeenCalledTimes(1);
				expect(tspFetchService.fetchTspClasses).toHaveBeenCalledWith(system, config.dataDaysToFetch);
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
				const { oauthDataDto, school } = setup();

				await sut.sync();

				expect(provisioningService.provisionUserBatch).toHaveBeenCalledWith(
					[oauthDataDto],
					new Map([[school.externalId, school]])
				);
			});

			it('should call provisioning service to provision class batches', async () => {
				setup();

				await sut.sync();

				expect(provisioningService.provisionClassBatch).toHaveBeenCalledTimes(1);
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

		describe('when school has no externalId', () => {
			const setup = () => {
				setupMockServices({
					foundSystem: systemFactory.build({
						type: SystemType.OIDC,
						provisioningStrategy: SystemProvisioningStrategy.TSP,
						oauthConfig: systemOauthConfigFactory.build(),
					}),
					foundSystemSchools: schoolFactory.buildList(2),
				});
			};

			it('should throw BadDataLoggableException', async () => {
				setup();

				await expect(() => sut.sync()).rejects.toThrow(BadDataLoggableException);
			});
		});

		describe('when externalSchool has no externalId', () => {
			const setup = () => {
				setupMockServices({
					foundSystem: systemFactory.build({
						type: SystemType.OIDC,
						provisioningStrategy: SystemProvisioningStrategy.TSP,
						oauthConfig: systemOauthConfigFactory.build(),
					}),
					foundSystemSchools: schoolFactory.buildList(1, {
						externalId: faker.string.uuid(),
					}),
					mappedOauthDto: {
						oauthDataDtos: oauthDataDtoFactory.buildList(1, {
							externalSchool: externalSchoolDtoFactory.build({
								externalId: undefined,
							}),
						}),
						usersOfClasses: new Map(),
					},
				});
			};

			it('should throw BadDataLoggableException', async () => {
				setup();

				await expect(() => sut.sync()).rejects.toThrow(BadDataLoggableException);
			});
		});

		describe('when school with externalId is not found', () => {
			const setup = () => {
				setupMockServices({
					foundSystem: systemFactory.build({
						type: SystemType.OIDC,
						provisioningStrategy: SystemProvisioningStrategy.TSP,
						oauthConfig: systemOauthConfigFactory.build(),
					}),
					foundSystemSchools: schoolFactory.buildList(1, {
						externalId: faker.string.uuid(),
					}),
					mappedOauthDto: {
						oauthDataDtos: oauthDataDtoFactory.buildList(1, {
							externalSchool: externalSchoolDtoFactory.build(),
						}),
						usersOfClasses: new Map([
							[faker.string.uuid(), [{ externalId: faker.string.uuid(), role: RoleName.TEACHER }]],
						]),
					},
				});
			};
			it('should throw NotFoundLoggableException', async () => {
				setup();

				await expect(() => sut.sync()).rejects.toThrow(NotFoundLoggableException);
			});
		});
	});
});
