import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import {
	ExportApiInterface,
	RobjExportKlasse,
	RobjExportLehrer,
	RobjExportSchueler,
	RobjExportSchule,
	TspClientFactory,
} from '@infra/tsp-client';
import { School, SchoolService } from '@modules/school';
import { SystemService, SystemType } from '@modules/system';
import { Test, TestingModule } from '@nestjs/testing';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { federalStateFactory, schoolYearFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { FederalStateService, SchoolYearService } from '@src/modules/legacy-school';
import { BadDataLoggableException } from '@src/modules/provisioning/loggable';
import { SchoolProps } from '@src/modules/school/domain';
import { FederalStateEntityMapper, SchoolYearEntityMapper } from '@src/modules/school/repo/mikro-orm/mapper';
import { schoolFactory } from '@src/modules/school/testing';
import { systemFactory } from '@src/modules/system/testing';
import { AxiosResponse } from 'axios';
import { TspMissingExternalIdLoggable } from './loggable/tsp-missing-external-id.loggable';
import { TspSyncService } from './tsp-sync.service';
import { ExternalSchoolDto, OauthDataDto, ProvisioningSystemDto } from '@src/modules/provisioning';
import { RoleName } from '@shared/domain/interface';

describe(TspSyncService.name, () => {
	let module: TestingModule;
	let sut: TspSyncService;
	let tspClientFactory: DeepMocked<TspClientFactory>;
	let systemService: DeepMocked<SystemService>;
	let schoolService: DeepMocked<SchoolService>;
	let federalStateService: DeepMocked<FederalStateService>;
	let schoolYearService: DeepMocked<SchoolYearService>;
	let logger: DeepMocked<Logger>;

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

	describe('fetchTspTeachers', () => {
		describe('when tsp teachers are fetched', () => {
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

				const tspTeacher: RobjExportLehrer = {
					schuleNummer: faker.string.alpha(),
					lehrerVorname: faker.string.alpha(),
					lehrerNachname: faker.string.alpha(),
					lehrerUid: faker.string.alpha(),
				};
				const teachers = [tspTeacher];
				const response = createMock<AxiosResponse<Array<RobjExportLehrer>>>({
					data: teachers,
				});

				const exportApiMock = createMock<ExportApiInterface>();
				exportApiMock.exportLehrerList.mockResolvedValueOnce(response);
				tspClientFactory.createExportClient.mockReturnValueOnce(exportApiMock);

				return { clientId, clientSecret, tokenEndpoint, system, exportApiMock, teachers };
			};

			it('should use the oauthConfig to create the client', async () => {
				const { clientId, clientSecret, tokenEndpoint, system } = setup();

				await sut.fetchTspTeachers(system, 1);

				expect(tspClientFactory.createExportClient).toHaveBeenCalledWith({
					clientId,
					clientSecret,
					tokenEndpoint,
				});
			});

			it('should call exportLehrerList', async () => {
				const { system, exportApiMock } = setup();

				await sut.fetchTspTeachers(system, 1);

				expect(exportApiMock.exportLehrerList).toHaveBeenCalledTimes(1);
			});

			it('should return an array of teachers', async () => {
				const { system } = setup();

				const teachers = await sut.fetchTspTeachers(system, 1);

				expect(teachers).toBeDefined();
				expect(teachers).toBeInstanceOf(Array);
			});
		});
	});

	describe('fetchTspStudents', () => {
		describe('when tsp students are fetched', () => {
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

				const tspStudent: RobjExportSchueler = {
					schuleNummer: faker.string.alpha(),
					schuelerVorname: faker.string.alpha(),
					schuelerNachname: faker.string.alpha(),
					schuelerUid: faker.string.alpha(),
				};
				const students = [tspStudent];
				const response = createMock<AxiosResponse<Array<RobjExportSchueler>>>({
					data: students,
				});

				const exportApiMock = createMock<ExportApiInterface>();
				exportApiMock.exportSchuelerList.mockResolvedValueOnce(response);
				tspClientFactory.createExportClient.mockReturnValueOnce(exportApiMock);

				return { clientId, clientSecret, tokenEndpoint, system, exportApiMock, students };
			};

			it('should use the oauthConfig to create the client', async () => {
				const { clientId, clientSecret, tokenEndpoint, system } = setup();

				await sut.fetchTspStudents(system, 1);

				expect(tspClientFactory.createExportClient).toHaveBeenCalledWith({
					clientId,
					clientSecret,
					tokenEndpoint,
				});
			});

			it('should call exportSchuelerList', async () => {
				const { system, exportApiMock } = setup();

				await sut.fetchTspStudents(system, 1);

				expect(exportApiMock.exportSchuelerList).toHaveBeenCalledTimes(1);
			});

			it('should return an array of students', async () => {
				const { system } = setup();

				const students = await sut.fetchTspStudents(system, 1);

				expect(students).toBeDefined();
				expect(students).toBeInstanceOf(Array);
			});
		});
	});

	describe('fetchTspClasses', () => {
		describe('when tsp classes are fetched', () => {
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

				const tspClass: RobjExportKlasse = {
					schuleNummer: faker.string.alpha(),
					klasseId: faker.string.alpha(),
					klasseName: faker.string.alpha(),
					lehrerUid: faker.string.alpha(),
				};
				const classes = [tspClass];
				const response = createMock<AxiosResponse<Array<RobjExportKlasse>>>({
					data: classes,
				});

				const exportApiMock = createMock<ExportApiInterface>();
				exportApiMock.exportKlasseList.mockResolvedValueOnce(response);
				tspClientFactory.createExportClient.mockReturnValueOnce(exportApiMock);

				return { clientId, clientSecret, tokenEndpoint, system, exportApiMock, classes };
			};

			it('should use the oauthConfig to create the client', async () => {
				const { clientId, clientSecret, tokenEndpoint, system } = setup();

				await sut.fetchTspClasses(system, 1);

				expect(tspClientFactory.createExportClient).toHaveBeenCalledWith({
					clientId,
					clientSecret,
					tokenEndpoint,
				});
			});

			it('should call exportKlasseList', async () => {
				const { system, exportApiMock } = setup();

				await sut.fetchTspClasses(system, 1);

				expect(exportApiMock.exportKlasseList).toHaveBeenCalledTimes(1);
			});

			it('should return an array of classes', async () => {
				const { system } = setup();

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

	describe('mapTspDataToOauthData', () => {
		describe('when mapping tsp data to oauth data', () => {
			const setup = () => {
				const system = systemFactory.build();

				const school = schoolFactory.build({
					externalId: faker.string.alpha(),
				});

				const lehrerUid = faker.string.alpha();

				const tspTeachers: RobjExportLehrer[] = [
					{
						lehrerUid,
						lehrerNachname: faker.string.alpha(),
						lehrerVorname: faker.string.alpha(),
						schuleNummer: school.externalId,
					},
				];

				const klasseId = faker.string.alpha();

				const tspClasses: RobjExportKlasse[] = [
					{
						klasseId,
						klasseName: faker.string.alpha(),
						lehrerUid,
					},
				];

				const tspStudents: RobjExportSchueler[] = [
					{
						schuelerUid: faker.string.alpha(),
						schuelerNachname: faker.string.alpha(),
						schuelerVorname: faker.string.alpha(),
						schuleNummer: school.externalId,
						klasseId,
					},
				];

				const provisioningSystemDto: ProvisioningSystemDto = {
					systemId: system.id,
					provisioningStrategy: SystemProvisioningStrategy.TSP,
				};

				const externalSchool: ExternalSchoolDto = {
					externalId: school.externalId ?? '',
				};

				const expected: OauthDataDto[] = [
					{
						system: provisioningSystemDto,
						externalUser: {
							externalId: tspTeachers[0].lehrerUid ?? '',
							firstName: tspTeachers[0].lehrerNachname,
							lastName: tspTeachers[0].lehrerNachname,
							roles: [RoleName.TEACHER],
							email: `tsp/${tspTeachers[0].lehrerUid ?? ''}@schul-cloud.org`,
						},
						externalSchool,
					},
				];

				return { system, school, tspTeachers, tspStudents, tspClasses, expected };
			};

			it('should return an array of oauth data dtos', () => {
				const { system, school, tspTeachers, tspStudents, tspClasses, expected } = setup();

				const result = sut.mapTspDataToOauthData(system, [school], tspTeachers, tspStudents, tspClasses);

				// TODO
			});
		});

		describe('when school has to externalId', () => {
			const setup = () => {
				const system = systemFactory.build();
				const school = schoolFactory.build({
					externalId: undefined,
				});

				return { system, school };
			};

			it('should throw BadDataLoggableException', () => {
				const { system, school } = setup();

				expect(() => sut.mapTspDataToOauthData(system, [school], [], [], [])).toThrow(BadDataLoggableException);
			});
		});

		describe('when tsp class has to id', () => {
			const setup = () => {
				const system = systemFactory.build();

				const tspClass: RobjExportKlasse = {
					klasseId: undefined,
				};

				return { system, tspClass };
			};

			it('should log TspMissingExternalIdLoggable', () => {
				const { system, tspClass } = setup();

				sut.mapTspDataToOauthData(system, [], [], [], [tspClass]);

				expect(logger.info).toHaveBeenCalledWith(new TspMissingExternalIdLoggable('class'));
			});
		});

		describe('when tsp teacher has to id', () => {
			const setup = () => {
				const system = systemFactory.build();

				const tspTeacher: RobjExportLehrer = {
					lehrerUid: undefined,
				};

				return { system, tspTeacher };
			};

			it('should log TspMissingExternalIdLoggable', () => {
				const { system, tspTeacher } = setup();

				sut.mapTspDataToOauthData(system, [], [tspTeacher], [], []);

				expect(logger.info).toHaveBeenCalledWith(new TspMissingExternalIdLoggable('teacher'));
			});
		});

		describe('when tsp student has to id', () => {
			const setup = () => {
				const system = systemFactory.build();

				const tspStudent: RobjExportSchueler = {
					schuelerUid: undefined,
				};

				return { system, tspStudent };
			};

			it('should log TspMissingExternalIdLoggable', () => {
				const { system, tspStudent } = setup();

				sut.mapTspDataToOauthData(system, [], [], [tspStudent], []);

				expect(logger.info).toHaveBeenCalledWith(new TspMissingExternalIdLoggable('student'));
			});
		});
	});
});
