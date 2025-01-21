import { AxiosErrorLoggable, ErrorLoggable } from '@core/error/loggable';
import { Logger } from '@core/logger';
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
import { OauthConfigMissingLoggableException } from '@modules/oauth/loggable';
import { systemFactory } from '@modules/system/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosError, AxiosResponse } from 'axios';
import { TspFetchService } from './tsp-fetch.service';

describe(TspFetchService.name, () => {
	let module: TestingModule;
	let sut: TspFetchService;
	let tspClientFactory: DeepMocked<TspClientFactory>;
	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TspFetchService,
				{
					provide: TspClientFactory,
					useValue: createMock<TspClientFactory>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		sut = module.get(TspFetchService);
		tspClientFactory = module.get(TspClientFactory);
		logger = module.get(Logger);
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

	describe('fetchTsp', () => {
		describe('when AxiosError is thrown', () => {
			const setup = () => {
				const system = systemFactory.build({
					oauthConfig: {
						clientId: faker.string.alpha(),
						clientSecret: faker.string.alpha(),
						tokenEndpoint: faker.internet.url(),
					},
				});

				const exportApiMock = createMock<ExportApiInterface>();
				exportApiMock.exportSchuleList.mockImplementation(() => {
					throw new AxiosError();
				});

				tspClientFactory.createExportClient.mockReturnValueOnce(exportApiMock);

				return {
					system,
					exportApiMock,
				};
			};

			it('should log a AxiosErrorLoggable as warning', async () => {
				const { system } = setup();

				await sut.fetchTspSchools(system, 1);

				expect(logger.warning).toHaveBeenCalledWith(new AxiosErrorLoggable(new AxiosError(), 'TSP_FETCH_ERROR'));
			});
		});

		describe('when generic Error is thrown', () => {
			const setup = () => {
				const system = systemFactory.build({
					oauthConfig: {
						clientId: faker.string.alpha(),
						clientSecret: faker.string.alpha(),
						tokenEndpoint: faker.internet.url(),
					},
				});

				const exportApiMock = createMock<ExportApiInterface>();
				exportApiMock.exportSchuleList.mockImplementation(() => {
					throw new Error();
				});

				tspClientFactory.createExportClient.mockReturnValueOnce(exportApiMock);

				return {
					system,
					exportApiMock,
				};
			};

			it('should log a ErrorLoggable as warning', async () => {
				const { system } = setup();

				await sut.fetchTspSchools(system, 1);

				expect(logger.warning).toHaveBeenCalledWith(new ErrorLoggable(new Error()));
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
