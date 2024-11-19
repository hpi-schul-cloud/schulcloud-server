import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import {
	ExportApiInterface,
	RobjExportKlasse,
	RobjExportLehrer,
	RobjExportLehrerMigration,
	RobjExportSchueler,
	RobjExportSchuelerMigration,
	RobjExportSchule,
	TspClientFactory,
} from '@infra/tsp-client';
import { School, SchoolService } from '@modules/school';
import { SystemService, SystemType } from '@modules/system';
import { Test, TestingModule } from '@nestjs/testing';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { federalStateFactory, schoolYearFactory, userDoFactory } from '@shared/testing';
import { AccountService } from '@src/modules/account';
import { accountDoFactory } from '@src/modules/account/testing';
import { FederalStateService, SchoolYearService } from '@src/modules/legacy-school';
import { OauthConfigMissingLoggableException } from '@src/modules/oauth/loggable';
import { FileStorageType, SchoolProps } from '@src/modules/school/domain';
import { FederalStateEntityMapper, SchoolYearEntityMapper } from '@src/modules/school/repo/mikro-orm/mapper';
import { schoolFactory } from '@src/modules/school/testing';
import { systemFactory } from '@src/modules/system/testing';
import { UserService } from '@src/modules/user';
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
	let userService: DeepMocked<UserService>;
	let accountService: DeepMocked<AccountService>;

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
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
				},
			],
		}).compile();

		sut = module.get(TspSyncService);
		tspClientFactory = module.get(TspClientFactory);
		systemService = module.get(SystemService);
		schoolService = module.get(SchoolService);
		federalStateService = module.get(FederalStateService);
		schoolYearService = module.get(SchoolYearService);
		userService = module.get(UserService);
		accountService = module.get(AccountService);
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

	const setupTspClient = () => {
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
		const responseSchools = createMock<AxiosResponse<Array<RobjExportSchule>>>({
			data: schools,
		});

		const tspTeacher: RobjExportLehrer = {
			schuleNummer: faker.string.alpha(),
			lehrerVorname: faker.string.alpha(),
			lehrerNachname: faker.string.alpha(),
			lehrerUid: faker.string.alpha(),
		};
		const teachers = [tspTeacher];
		const responseTeachers = createMock<AxiosResponse<Array<RobjExportLehrer>>>({
			data: teachers,
		});

		const tspStudent: RobjExportSchueler = {
			schuleNummer: faker.string.alpha(),
			schuelerVorname: faker.string.alpha(),
			schuelerNachname: faker.string.alpha(),
			schuelerUid: faker.string.alpha(),
		};
		const students = [tspStudent];
		const responseStudents = createMock<AxiosResponse<Array<RobjExportSchueler>>>({
			data: students,
		});

		const tspClass: RobjExportKlasse = {
			schuleNummer: faker.string.alpha(),
			klasseId: faker.string.alpha(),
			klasseName: faker.string.alpha(),
			lehrerUid: faker.string.alpha(),
		};
		const classes = [tspClass];
		const responseClasses = createMock<AxiosResponse<Array<RobjExportKlasse>>>({
			data: classes,
		});

		const tspTeacherMigration: RobjExportLehrerMigration = {
			lehrerUidAlt: faker.string.alpha(),
			lehrerUidNeu: faker.string.alpha(),
		};
		const teacherMigrations = [tspTeacherMigration];
		const responseTeacherMigrations = createMock<AxiosResponse<Array<RobjExportLehrerMigration>>>({
			data: teacherMigrations,
		});

		const tspStudentMigration: RobjExportSchuelerMigration = {
			schuelerUidAlt: faker.string.alpha(),
			schuelerUidNeu: faker.string.alpha(),
		};
		const studentMigrations = [tspStudentMigration];
		const responseStudentMigrations = createMock<AxiosResponse<Array<RobjExportSchuelerMigration>>>({
			data: studentMigrations,
		});

		const exportApiMock = createMock<ExportApiInterface>();
		exportApiMock.exportSchuleList.mockResolvedValueOnce(responseSchools);
		exportApiMock.exportLehrerList.mockResolvedValueOnce(responseTeachers);
		exportApiMock.exportSchuelerList.mockResolvedValueOnce(responseStudents);
		exportApiMock.exportKlasseList.mockResolvedValueOnce(responseClasses);
		exportApiMock.exportLehrerListMigration.mockResolvedValueOnce(responseTeacherMigrations);
		exportApiMock.exportSchuelerListMigration.mockResolvedValueOnce(responseStudentMigrations);

		tspClientFactory.createExportClient.mockReturnValueOnce(exportApiMock);

		return {
			clientId,
			clientSecret,
			tokenEndpoint,
			system,
			exportApiMock,
			schools,
			teachers,
			students,
			classes,
			teacherMigrations,
			studentMigrations,
		};
	};

	describe('fetchTspSchools', () => {
		describe('when tsp schools are fetched', () => {
			it('should use the oauthConfig to create the client', async () => {
				const { clientId, clientSecret, tokenEndpoint, system } = setupTspClient();

				await sut.fetchTspSchools(system, 1);

				expect(tspClientFactory.createExportClient).toHaveBeenCalledWith({
					clientId,
					clientSecret,
					tokenEndpoint,
				});
			});

			it('should call exportSchuleList', async () => {
				const { system, exportApiMock } = setupTspClient();

				await sut.fetchTspSchools(system, 1);

				expect(exportApiMock.exportSchuleList).toHaveBeenCalledTimes(1);
			});

			it('should return an array of schools', async () => {
				const { system } = setupTspClient();

				const schools = await sut.fetchTspSchools(system, 1);

				expect(schools).toBeDefined();
				expect(schools).toBeInstanceOf(Array);
			});
		});
	});

	describe('fetchTspTeachers', () => {
		describe('when tsp teachers are fetched', () => {
			it('should use the oauthConfig to create the client', async () => {
				const { clientId, clientSecret, tokenEndpoint, system } = setupTspClient();

				await sut.fetchTspTeachers(system, 1);

				expect(tspClientFactory.createExportClient).toHaveBeenCalledWith({
					clientId,
					clientSecret,
					tokenEndpoint,
				});
			});

			it('should call exportLehrerList', async () => {
				const { system, exportApiMock } = setupTspClient();

				await sut.fetchTspTeachers(system, 1);

				expect(exportApiMock.exportLehrerList).toHaveBeenCalledTimes(1);
			});

			it('should return an array of teachers', async () => {
				const { system } = setupTspClient();

				const teachers = await sut.fetchTspTeachers(system, 1);

				expect(teachers).toBeDefined();
				expect(teachers).toBeInstanceOf(Array);
			});
		});
	});

	describe('fetchTspStudents', () => {
		describe('when tsp students are fetched', () => {
			it('should use the oauthConfig to create the client', async () => {
				const { clientId, clientSecret, tokenEndpoint, system } = setupTspClient();

				await sut.fetchTspStudents(system, 1);

				expect(tspClientFactory.createExportClient).toHaveBeenCalledWith({
					clientId,
					clientSecret,
					tokenEndpoint,
				});
			});

			it('should call exportSchuelerList', async () => {
				const { system, exportApiMock } = setupTspClient();

				await sut.fetchTspStudents(system, 1);

				expect(exportApiMock.exportSchuelerList).toHaveBeenCalledTimes(1);
			});

			it('should return an array of students', async () => {
				const { system } = setupTspClient();

				const students = await sut.fetchTspStudents(system, 1);

				expect(students).toBeDefined();
				expect(students).toBeInstanceOf(Array);
			});
		});
	});

	describe('fetchTspClasses', () => {
		describe('when tsp classes are fetched', () => {
			it('should use the oauthConfig to create the client', async () => {
				const { clientId, clientSecret, tokenEndpoint, system } = setupTspClient();

				await sut.fetchTspClasses(system, 1);

				expect(tspClientFactory.createExportClient).toHaveBeenCalledWith({
					clientId,
					clientSecret,
					tokenEndpoint,
				});
			});

			it('should call exportKlasseList', async () => {
				const { system, exportApiMock } = setupTspClient();

				await sut.fetchTspClasses(system, 1);

				expect(exportApiMock.exportKlasseList).toHaveBeenCalledTimes(1);
			});

			it('should return an array of classes', async () => {
				const { system } = setupTspClient();

				const classes = await sut.fetchTspClasses(system, 1);

				expect(classes).toBeDefined();
				expect(classes).toBeInstanceOf(Array);
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

	describe('findSchoolsForSystem', () => {
		describe('when findSchoolsForSystem is called', () => {
			const setup = () => {
				const system = systemFactory.build();
				const school = schoolFactory.build();

				schoolService.getSchools.mockResolvedValueOnce([school]);

				return { system, school };
			};

			it('should return an array of schools', async () => {
				const { system, school } = setup();

				const schools = await sut.findSchoolsForSystem(system);

				expect(schools).toEqual([school]);
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
						fileStorageType: FileStorageType.AWS_S3,
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
						fileStorageType: FileStorageType.AWS_S3,
					}) as Partial<SchoolProps>,
				});
				expect(federalStateService.findFederalStateByName).not.toHaveBeenCalled();
			});
		});
	});

	describe('fetchTspTeacherMigrations', () => {
		describe('when tsp teacher migrations are fetched', () => {
			it('should create the client', async () => {
				const { clientId, clientSecret, tokenEndpoint, system } = setupTspClient();

				await sut.fetchTspTeacherMigrations(system);

				expect(tspClientFactory.createExportClient).toHaveBeenCalledWith({
					clientId,
					clientSecret,
					tokenEndpoint,
				});
			});

			it('should call exportLehrerListMigration', async () => {
				const { system, exportApiMock } = setupTspClient();

				await sut.fetchTspTeacherMigrations(system);

				expect(exportApiMock.exportLehrerListMigration).toHaveBeenCalledTimes(1);
			});

			it('should return an array of teacher migrations', async () => {
				const { system } = setupTspClient();

				const result = await sut.fetchTspTeacherMigrations(system);

				expect(result).toBeDefined();
				expect(result).toBeInstanceOf(Array);
			});
		});
	});

	describe('fetchTspStudentMigrations', () => {
		describe('when tsp student migrations are fetched', () => {
			it('should create the client', async () => {
				const { clientId, clientSecret, tokenEndpoint, system } = setupTspClient();

				await sut.fetchTspStudentMigrations(system);

				expect(tspClientFactory.createExportClient).toHaveBeenCalledWith({
					clientId,
					clientSecret,
					tokenEndpoint,
				});
			});

			it('should call exportSchuelerListMigration', async () => {
				const { system, exportApiMock } = setupTspClient();

				await sut.fetchTspStudentMigrations(system);

				expect(exportApiMock.exportSchuelerListMigration).toHaveBeenCalledTimes(1);
			});

			it('should return an array of student migrations', async () => {
				const { system } = setupTspClient();

				const result = await sut.fetchTspStudentMigrations(system);

				expect(result).toBeDefined();
				expect(result).toBeInstanceOf(Array);
			});
		});
	});

	describe('findUserByTspUid', () => {
		describe('when user is found', () => {
			const setup = () => {
				const tspUid = faker.string.alpha();
				const user = userDoFactory.build();

				userService.findUsers.mockResolvedValueOnce({ data: [user], total: 1 });

				return { tspUid, user };
			};

			it('should return the user', async () => {
				const { tspUid, user } = setup();

				const result = await sut.findUserByTspUid(tspUid);

				expect(result).toBe(user);
			});
		});

		describe('when user is not found', () => {
			const setup = () => {
				const tspUid = faker.string.alpha();

				userService.findUsers.mockResolvedValueOnce({ data: [], total: 0 });

				return { tspUid };
			};

			it('should return null', async () => {
				const { tspUid } = setup();

				const result = await sut.findUserByTspUid(tspUid);

				expect(result).toBeNull();
			});
		});
	});

	describe('findAccountByExternalId', () => {
		describe('when account is found', () => {
			const setup = () => {
				const externalId = faker.string.alpha();
				const systemId = faker.string.alpha();

				const user = userDoFactory.build();
				const account = accountDoFactory.build();

				user.id = faker.string.alpha();
				user.externalId = externalId;
				account.userId = user.id;

				userService.findByExternalId.mockResolvedValueOnce(user);
				accountService.findByUserId.mockResolvedValueOnce(account);

				return { externalId, systemId, account };
			};

			it('should return the account', async () => {
				const { externalId, systemId, account } = setup();

				const result = await sut.findAccountByExternalId(externalId, systemId);

				expect(result).toBe(account);
			});
		});

		describe('when account is not found', () => {
			const setup = () => {
				const externalId = faker.string.alpha();
				const systemId = faker.string.alpha();

				userService.findByExternalId.mockResolvedValueOnce(null);
				accountService.findByUserId.mockResolvedValueOnce(null);

				return { externalId, systemId };
			};

			it('should return null', async () => {
				const { externalId, systemId } = setup();

				const result = await sut.findAccountByExternalId(externalId, systemId);

				expect(result).toBeNull();
			});
		});
	});

	describe('updateUser', () => {
		describe('when user is updated', () => {
			const setup = () => {
				const oldUid = faker.string.alpha();
				const newUid = faker.string.alpha();
				const email = faker.internet.email();
				const user = userDoFactory.build();

				userService.save.mockResolvedValueOnce(user);

				return { oldUid, newUid, email, user };
			};

			it('should return the updated user', async () => {
				const { oldUid, newUid, email, user } = setup();

				const result = await sut.updateUser(user, email, newUid, oldUid);

				expect(result).toBe(user);
			});
		});
	});

	describe('updateAccount', () => {
		describe('when account is updated', () => {
			const setup = () => {
				const username = faker.internet.userName();
				const systemId = faker.string.alpha();
				const account = accountDoFactory.build();

				accountService.save.mockResolvedValueOnce(account);

				return { username, systemId, account };
			};

			it('should return the updated account', async () => {
				const { username, systemId, account } = setup();

				const result = await sut.updateAccount(account, username, systemId);

				expect(result).toBe(account);
			});
		});
	});

	describe('createClient', () => {
		describe('when oauthConfig is missing', () => {
			const setup = () => {
				const system = systemFactory.build({ oauthConfig: undefined });

				return { system };
			};

			it('should throw an OauthConfigMissingLoggableException', async () => {
				const { system } = setup();

				await expect(async () => sut.fetchTspSchools(system, 1)).rejects.toThrow(OauthConfigMissingLoggableException);
			});
		});
	});
});
