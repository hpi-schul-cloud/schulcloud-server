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
import { userDoFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { Account } from '@src/modules/account';
import { accountDoFactory } from '@src/modules/account/testing';
import { ExternalUserDto, OauthDataDto, ProvisioningService, ProvisioningSystemDto } from '@src/modules/provisioning';
import { School } from '@src/modules/school';
import { schoolFactory } from '@src/modules/school/testing';
import { System } from '@src/modules/system';
import { systemFactory } from '@src/modules/system/testing';
import { SyncStrategyTarget } from '../../sync-strategy.types';
import { TspLegacyMigrationService } from './tsp-legacy-migration.service';
import { TspFetchService } from './tsp-fetch.service';
import { TspOauthDataMapper } from './tsp-oauth-data.mapper';
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
								case 'TSP_SYNC_MIGRATION_LIMIT':
									return 10;
								case 'FEATURE_TSP_MIGRATION_ENABLED':
									return true;
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
				{
					provide: TspOauthDataMapper,
					useValue: createMock<TspOauthDataMapper>(),
				},
				{
					provide: TspLegacyMigrationService,
					useValue: createMock<TspLegacyMigrationService>(),
				},
			],
		}).compile();

		sut = module.get(TspSyncStrategy);
		tspSyncService = module.get(TspSyncService);
		tspFetchService = module.get(TspFetchService);
		provisioningService = module.get(ProvisioningService);
		tspOauthDataMapper = module.get(TspOauthDataMapper);
		tspLegacyMigrationService = module.get(TspLegacyMigrationService);
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
	}) => {
		tspFetchService.fetchTspSchools.mockResolvedValueOnce(params.fetchedSchools ?? []);
		tspFetchService.fetchTspClasses.mockResolvedValueOnce(params.fetchedClasses ?? []);
		tspFetchService.fetchTspStudents.mockResolvedValueOnce(params.fetchedStudents ?? []);
		tspFetchService.fetchTspTeachers.mockResolvedValueOnce(params.fetchedTeachers ?? []);
		tspFetchService.fetchTspTeacherMigrations.mockResolvedValueOnce(params.fetchedTeacherMigrations ?? []);
		tspFetchService.fetchTspStudentMigrations.mockResolvedValueOnce(params.fetchedStudentMigrations ?? []);

		tspSyncService.findSchool.mockResolvedValue(params.foundSchool ?? undefined);
		tspSyncService.findSchoolsForSystem.mockResolvedValueOnce(params.foundSystemSchools ?? []);
		tspSyncService.findUserByTspUid.mockResolvedValueOnce(
			params.foundTspUidUser !== undefined ? params.foundTspUidUser : userDoFactory.build()
		);
		tspSyncService.updateUser.mockResolvedValueOnce(params.updatedUser ?? userDoFactory.build());
		tspSyncService.findAccountByExternalId.mockResolvedValueOnce(
			params.foundTspUidAccount !== undefined ? params.foundTspUidAccount : accountDoFactory.build()
		);
		tspSyncService.updateAccount.mockResolvedValueOnce(params.updatedAccount ?? accountDoFactory.build());
		tspSyncService.findTspSystemOrFail.mockResolvedValueOnce(params.foundSystem ?? systemFactory.build());

		tspOauthDataMapper.mapTspDataToOauthData.mockReturnValueOnce(params.mappedOauthDto ?? []);
	};

	describe('sync', () => {
		describe('when sync is called', () => {
			const setup = () => {
				const oauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: faker.string.alpha(),
						provisioningStrategy: SystemProvisioningStrategy.TSP,
					}),
					externalUser: new ExternalUserDto({
						externalId: faker.string.alpha(),
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
				});

				return { oauthDataDto };
			};

			it('should find the tsp system', async () => {
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

				it('find user by tsp Uid', async () => {
					setup();

					await sut.sync();

					expect(tspSyncService.findUserByTspUid).toHaveBeenCalled();
				});

				it('should update user', async () => {
					setup();

					await sut.sync();

					expect(tspSyncService.updateUser).toHaveBeenCalled();
				});

				it('should find account by tsp Uid', async () => {
					setup();

					await sut.sync();

					expect(tspSyncService.findAccountByExternalId).toHaveBeenCalled();
				});

				it('should update account', async () => {
					setup();

					await sut.sync();

					expect(tspSyncService.updateAccount).toHaveBeenCalled();
				});
			});
		});

		describe('when school does not exist', () => {
			const setup = () => {
				const tspSchool: RobjExportSchule = {
					schuleNummer: faker.string.alpha(),
					schuleName: faker.string.alpha(),
				};
				const tspSchools = [tspSchool];

				setupMockServices({
					fetchedSchools: tspSchools,
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
				const tspSchool: RobjExportSchule = {
					schuleNummer: faker.string.alpha(),
					schuleName: faker.string.alpha(),
				};
				const tspSchools = [tspSchool];
				const school = schoolFactory.build();

				setupMockServices({
					fetchedSchools: tspSchools,
					foundSchool: school,
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
				const tspSchool: RobjExportSchule = {
					schuleNummer: undefined,
					schuleName: faker.string.alpha(),
				};
				const tspSchools = [tspSchool];

				setupMockServices({
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

		describe('when UidAlt or UidNeu is missing during migration', () => {
			const setup = () => {
				const tspTeacher: RobjExportLehrerMigration = {
					lehrerUidAlt: undefined,
					lehrerUidNeu: faker.string.alpha(),
				};
				const tspStudent: RobjExportSchuelerMigration = {
					schuelerUidAlt: faker.string.alpha(),
					schuelerUidNeu: undefined,
				};

				setupMockServices({
					fetchedStudentMigrations: [tspStudent],
					fetchedTeacherMigrations: [tspTeacher],
				});
			};

			it('should return false and not call findUserByTspUid', async () => {
				setup();

				await sut.sync();

				expect(tspSyncService.findUserByTspUid).not.toHaveBeenCalled();
			});
		});

		describe('when no user is found during migration', () => {
			const setup = () => {
				const tspTeacher: RobjExportLehrerMigration = {
					lehrerUidAlt: faker.string.alpha(),
					lehrerUidNeu: faker.string.alpha(),
				};

				setupMockServices({
					fetchedTeacherMigrations: [tspTeacher],
					foundTspUidUser: null,
				});

				return { tspTeacher };
			};

			it('should throw and not call updateUser', async () => {
				setup();

				await sut.sync();

				expect(tspSyncService.updateUser).not.toHaveBeenCalled();
			});
		});

		describe('when no account is found during migration', () => {
			const setup = () => {
				const tspTeacher: RobjExportLehrerMigration = {
					lehrerUidAlt: faker.string.alpha(),
					lehrerUidNeu: faker.string.alpha(),
				};

				setupMockServices({
					fetchedTeacherMigrations: [tspTeacher],
					foundTspUidAccount: null,
				});
			};

			it('should throw and not call updateAccount', async () => {
				setup();

				await sut.sync();

				expect(tspSyncService.updateAccount).not.toHaveBeenCalled();
			});
		});
	});
});
