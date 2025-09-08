import { Logger } from '@core/logger';
import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { robjExportKlasseFactory, robjExportLehrerFactory, robjExportSchuelerFactory } from '@infra/tsp-client/testing';
import { ProvisioningSystemDto } from '@modules/provisioning';
import { BadDataLoggableException } from '@modules/provisioning/loggable';
import {
	externalClassDtoFactory,
	externalSchoolDtoFactory,
	externalUserDtoFactory,
	oauthDataDtoFactory,
	provisioningSystemDtoFactory,
} from '@modules/provisioning/testing/';
import { RoleName } from '@modules/role';
import { schoolFactory } from '@modules/school/testing';
import { systemFactory } from '@modules/system/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { TspMissingExternalIdLoggable } from './loggable/tsp-missing-external-id.loggable';
import { TspOauthDataMapper } from './tsp-oauth-data.mapper';

describe(TspOauthDataMapper.name, () => {
	let module: TestingModule;
	let sut: TspOauthDataMapper;
	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TspOauthDataMapper,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		sut = module.get(TspOauthDataMapper);
		logger = module.get(Logger);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when mapper is initialized', () => {
		it('should be defined', () => {
			expect(sut).toBeDefined();
		});
	});

	describe('mapTspDataToOauthData', () => {
		describe('when mapping tsp data to oauth data', () => {
			const setup = () => {
				const system = systemFactory.build();

				const school = schoolFactory.build({
					externalId: faker.string.uuid(),
				});

				const lehrerUid = faker.string.uuid();

				const tspTeacher = robjExportLehrerFactory.build({
					lehrerUid,
					schuleNummer: school.externalId,
					lehrerRollen: 'Lehrer',
				});
				const tspTeacherAdmin = robjExportLehrerFactory.build({
					lehrerUid: faker.string.uuid(),
					schuleNummer: school.externalId,
					lehrerRollen: 'Lehrer,Admin',
				});
				const tspAdmin = robjExportLehrerFactory.build({
					lehrerUid: faker.string.uuid(),
					schuleNummer: school.externalId,
					lehrerRollen: 'Admin',
				});
				const tspTeachers = [tspTeacher, tspTeacherAdmin, tspAdmin];

				const klasseId = faker.string.uuid();
				const klasse2Id = faker.string.uuid();

				const tspClass = robjExportKlasseFactory.build({
					klasseId,
					lehrerUid,
				});
				const tspClass2 = robjExportKlasseFactory.build({
					klasseId: klasse2Id,
					lehrerUid,
					klasseName: '1a',
				});
				const tspClasses = [tspClass, tspClass2];

				const tspStudent = robjExportSchuelerFactory.build({
					schuelerUid: faker.string.uuid(),
					schuelerNachname: faker.person.lastName(),
					schuelerVorname: faker.person.firstName(),
					schuleNummer: school.externalId,
					klasseId,
				});
				const tspStudentWithSecondClass = robjExportSchuelerFactory.build({
					schuelerUid: tspStudent.schuelerUid,
					schuelerNachname: tspStudent.schuelerNachname,
					schuelerVorname: tspStudent.schuelerVorname,
					schuleNummer: school.externalId,
					klasseId: klasse2Id,
				});
				const tspStudents = [tspStudent, tspStudentWithSecondClass];

				const provisioningSystemDto: ProvisioningSystemDto = provisioningSystemDtoFactory.build({
					systemId: system.id,
					provisioningStrategy: SystemProvisioningStrategy.TSP,
				});

				const externalClassDto = externalClassDtoFactory.build({
					externalId: tspClasses[0].klasseId ?? '',
					name: tspClasses[0].klasseName,
				});
				const externalClassDto2 = externalClassDtoFactory.build({
					externalId: tspClasses[1].klasseId ?? '',
					name: 'a',
					gradeLevel: 1,
				});

				const externalTeacherUserDto = externalUserDtoFactory.build({
					externalId: tspTeacher.lehrerUid ?? '',
					firstName: tspTeacher.lehrerVorname,
					lastName: tspTeacher.lehrerNachname,
					roles: [RoleName.TEACHER],
					email: undefined,
					birthday: undefined,
				});

				const externalTeacherAdminUserDto = externalUserDtoFactory.build({
					externalId: tspTeacherAdmin.lehrerUid ?? '',
					firstName: tspTeacherAdmin.lehrerVorname,
					lastName: tspTeacherAdmin.lehrerNachname,
					roles: [RoleName.TEACHER, RoleName.ADMINISTRATOR],
					email: undefined,
					birthday: undefined,
				});

				const externalAdminUserDto = externalUserDtoFactory.build({
					externalId: tspAdmin.lehrerUid ?? '',
					firstName: tspAdmin.lehrerVorname,
					lastName: tspAdmin.lehrerNachname,
					roles: [RoleName.ADMINISTRATOR],
					email: undefined,
					birthday: undefined,
				});

				const externalStudentUserDto = externalUserDtoFactory.build({
					externalId: tspStudents[0].schuelerUid ?? '',
					firstName: tspStudents[0].schuelerVorname,
					lastName: tspStudents[0].schuelerNachname,
					roles: [RoleName.STUDENT],
					email: undefined,
					birthday: undefined,
				});

				const externalSchoolDto = externalSchoolDtoFactory.build({
					externalId: school.externalId,
					name: school.name,
					officialSchoolNumber: undefined,
					location: undefined,
				});

				const expected = {
					oauthDataDtos: [
						oauthDataDtoFactory.build({
							system: provisioningSystemDto,
							externalUser: externalTeacherUserDto,
							externalClasses: [externalClassDto, externalClassDto2],
							externalSchool: externalSchoolDto,
						}),
						oauthDataDtoFactory.build({
							system: provisioningSystemDto,
							externalUser: externalTeacherAdminUserDto,
							externalClasses: [],
							externalSchool: externalSchoolDto,
						}),
						oauthDataDtoFactory.build({
							system: provisioningSystemDto,
							externalUser: externalAdminUserDto,
							externalClasses: [],
							externalSchool: externalSchoolDto,
						}),
						oauthDataDtoFactory.build({
							system: provisioningSystemDto,
							externalUser: externalStudentUserDto,
							externalClasses: [externalClassDto, externalClassDto2],
							externalSchool: externalSchoolDto,
						}),
					],
					usersOfClasses: new Map([
						[
							tspClass.klasseId ?? '',
							[
								{
									externalId: tspTeacher.lehrerUid,
									role: RoleName.TEACHER,
								},
								{
									externalId: tspStudent.schuelerUid,
									role: RoleName.STUDENT,
								},
							],
						],
						[
							tspClass2.klasseId ?? '',
							[
								{
									externalId: tspTeacher.lehrerUid,
									role: RoleName.TEACHER,
								},
								{
									externalId: tspStudent.schuelerUid,
									role: RoleName.STUDENT,
								},
							],
						],
					]),
				};

				return { system, school, tspTeachers, tspStudents, tspClasses, expected };
			};

			it('should return an array of oauth data dtos without duplicate users', () => {
				const { system, school, tspTeachers, tspStudents, tspClasses, expected } = setup();

				const result = sut.mapTspDataToOauthData(system, [school], tspTeachers, tspStudents, tspClasses);

				expect(result).toStrictEqual(expected);
			});
		});

		describe('when handling large amounts', () => {
			const setup = () => {
				const system = systemFactory.build();

				const school = schoolFactory.build({
					externalId: faker.string.uuid(),
				});

				const lehrerUid = faker.string.uuid();

				const tspTeachers = robjExportLehrerFactory.buildList(1000000, {
					lehrerUid,
					schuleNummer: school.externalId,
				});

				const tspClasses = [];

				const tspStudents = robjExportSchuelerFactory.buildList(1000000);

				return { system, school, tspTeachers, tspStudents, tspClasses };
			};

			it('should not throw RangeError', () => {
				const { system, school, tspTeachers, tspStudents, tspClasses } = setup();

				expect(() => sut.mapTspDataToOauthData(system, [school], tspTeachers, tspStudents, tspClasses)).not.toThrow(
					RangeError
				);
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

				const tspClass = robjExportKlasseFactory.build({
					klasseId: undefined,
				});

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

				const tspTeacher = robjExportLehrerFactory.build({
					lehrerUid: undefined,
				});

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

				const tspStudent = robjExportSchuelerFactory.build({
					schuelerUid: undefined,
				});

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
