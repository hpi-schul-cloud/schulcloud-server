import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { RobjExportLehrerMigration, RobjExportSchuelerMigration, RobjExportSchule } from '@infra/tsp-client';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { userDoFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { accountDoFactory } from '@src/modules/account/testing';
import { ExternalUserDto, OauthDataDto, ProvisioningService, ProvisioningSystemDto } from '@src/modules/provisioning';
import { schoolFactory } from '@src/modules/school/testing';
import { systemFactory } from '@src/modules/system/testing';
import { SyncStrategyTarget } from '../sync-strategy.types';
import { TspOauthDataMapper } from './tsp-oauth-data.mapper';
import { TspSyncConfig } from './tsp-sync.config';
import { TspSyncService } from './tsp-sync.service';
import { TspSyncStrategy } from './tsp-sync.strategy';

describe(TspSyncStrategy.name, () => {
	let module: TestingModule;
	let sut: TspSyncStrategy;
	let tspSyncService: DeepMocked<TspSyncService>;
	let provisioningService: DeepMocked<ProvisioningService>;
	let tspOauthDataMapper: DeepMocked<TspOauthDataMapper>;

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
			],
		}).compile();

		sut = module.get(TspSyncStrategy);
		tspSyncService = module.get(TspSyncService);
		provisioningService = module.get(ProvisioningService);
		tspOauthDataMapper = module.get(TspOauthDataMapper);
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

				const oauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: faker.string.alpha(),
						provisioningStrategy: SystemProvisioningStrategy.TSP,
					}),
					externalUser: new ExternalUserDto({
						externalId: faker.string.alpha(),
					}),
				});

				tspOauthDataMapper.mapTspDataToOauthData.mockReturnValueOnce([oauthDataDto]);

				const tspTeacher: RobjExportLehrerMigration = {
					lehrerUidAlt: faker.string.alpha(),
					lehrerUidNeu: faker.string.alpha(),
				};

				const tspStudent: RobjExportSchuelerMigration = {
					schuelerUidAlt: faker.string.alpha(),
					schuelerUidNeu: faker.string.alpha(),
				};

				tspSyncService.fetchTspTeacherMigrations.mockResolvedValueOnce([tspTeacher]);
				tspSyncService.fetchTspStudentMigrations.mockResolvedValueOnce([tspStudent]);
				tspSyncService.findUserByTspUid.mockResolvedValueOnce(userDoFactory.build());
				tspSyncService.updateUser.mockResolvedValueOnce(userDoFactory.build());
				tspSyncService.findAccountByTspUid.mockResolvedValueOnce(accountDoFactory.build());
				tspSyncService.updateAccount.mockResolvedValueOnce(accountDoFactory.build());

				tspSyncService.findTspSystemOrFail.mockResolvedValueOnce(systemFactory.build());

				return { oauthDataDto };
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

			it('should fetch the data', async () => {
				setup();

				await sut.sync();

				expect(tspSyncService.fetchTspTeachers).toHaveBeenCalled();
				expect(tspSyncService.fetchTspStudents).toHaveBeenCalled();
				expect(tspSyncService.fetchTspClasses).toHaveBeenCalled();
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

					expect(tspSyncService.fetchTspTeacherMigrations).toHaveBeenCalled();
				});

				it('should fetch student migrations', async () => {
					setup();

					await sut.sync();

					expect(tspSyncService.fetchTspStudentMigrations).toHaveBeenCalled();
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

					expect(tspSyncService.findAccountByTspUid).toHaveBeenCalled();
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
				tspSyncService.fetchTspSchools.mockResolvedValueOnce(tspSchools);

				tspSyncService.findSchool.mockResolvedValueOnce(undefined);

				tspSyncService.fetchTspClasses.mockResolvedValueOnce([]);
				tspSyncService.fetchTspStudents.mockResolvedValueOnce([]);
				tspSyncService.fetchTspTeachers.mockResolvedValueOnce([]);
				tspSyncService.findSchoolsForSystem.mockResolvedValueOnce([]);
				tspSyncService.fetchTspTeacherMigrations.mockResolvedValueOnce([]);
				tspSyncService.fetchTspStudentMigrations.mockResolvedValueOnce([]);
				tspOauthDataMapper.mapTspDataToOauthData.mockReturnValueOnce([]);
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

				tspSyncService.fetchTspClasses.mockResolvedValueOnce([]);
				tspSyncService.fetchTspStudents.mockResolvedValueOnce([]);
				tspSyncService.fetchTspTeachers.mockResolvedValueOnce([]);
				tspSyncService.findSchoolsForSystem.mockResolvedValueOnce([]);
				tspSyncService.fetchTspTeacherMigrations.mockResolvedValueOnce([]);
				tspSyncService.fetchTspStudentMigrations.mockResolvedValueOnce([]);
				tspOauthDataMapper.mapTspDataToOauthData.mockReturnValueOnce([]);
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

				tspSyncService.fetchTspClasses.mockResolvedValueOnce([]);
				tspSyncService.fetchTspStudents.mockResolvedValueOnce([]);
				tspSyncService.fetchTspTeachers.mockResolvedValueOnce([]);
				tspSyncService.findSchoolsForSystem.mockResolvedValueOnce([]);
				tspSyncService.fetchTspTeacherMigrations.mockResolvedValueOnce([]);
				tspSyncService.fetchTspStudentMigrations.mockResolvedValueOnce([]);
				tspOauthDataMapper.mapTspDataToOauthData.mockReturnValueOnce([]);
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

				tspSyncService.fetchTspTeacherMigrations.mockResolvedValueOnce([tspTeacher]);

				const tspStudent: RobjExportSchuelerMigration = {
					schuelerUidAlt: faker.string.alpha(),
					schuelerUidNeu: undefined,
				};

				tspSyncService.fetchTspStudentMigrations.mockResolvedValueOnce([tspStudent]);

				tspSyncService.fetchTspSchools.mockResolvedValueOnce([]);
				tspSyncService.fetchTspClasses.mockResolvedValueOnce([]);
				tspSyncService.fetchTspStudents.mockResolvedValueOnce([]);
				tspSyncService.fetchTspTeachers.mockResolvedValueOnce([]);
				tspSyncService.findTspSystemOrFail.mockResolvedValueOnce(systemFactory.build());
				tspOauthDataMapper.mapTspDataToOauthData.mockReturnValueOnce([]);
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

				tspSyncService.fetchTspTeacherMigrations.mockResolvedValueOnce([tspTeacher]);
				tspSyncService.findUserByTspUid.mockResolvedValueOnce(null);

				tspSyncService.fetchTspSchools.mockResolvedValueOnce([]);
				tspSyncService.fetchTspClasses.mockResolvedValueOnce([]);
				tspSyncService.fetchTspStudents.mockResolvedValueOnce([]);
				tspSyncService.fetchTspTeachers.mockResolvedValueOnce([]);
				tspSyncService.fetchTspStudentMigrations.mockResolvedValueOnce([]);
				tspSyncService.findTspSystemOrFail.mockResolvedValueOnce(systemFactory.build());
				tspOauthDataMapper.mapTspDataToOauthData.mockReturnValueOnce([]);

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

				tspSyncService.fetchTspTeacherMigrations.mockResolvedValueOnce([tspTeacher]);
				tspSyncService.findAccountByTspUid.mockResolvedValueOnce(null);

				tspSyncService.fetchTspSchools.mockResolvedValueOnce([]);
				tspSyncService.fetchTspClasses.mockResolvedValueOnce([]);
				tspSyncService.fetchTspStudents.mockResolvedValueOnce([]);
				tspSyncService.fetchTspTeachers.mockResolvedValueOnce([]);

				tspSyncService.fetchTspStudentMigrations.mockResolvedValueOnce([]);
				tspSyncService.findUserByTspUid.mockResolvedValueOnce(userDoFactory.build());
				tspSyncService.updateUser.mockResolvedValueOnce(userDoFactory.build());
				tspSyncService.findTspSystemOrFail.mockResolvedValueOnce(systemFactory.build());
				tspOauthDataMapper.mapTspDataToOauthData.mockReturnValueOnce([]);
			};

			it('should throw and not call updateAccount', async () => {
				setup();

				await sut.sync();

				expect(tspSyncService.updateAccount).not.toHaveBeenCalled();
			});
		});
	});
});
