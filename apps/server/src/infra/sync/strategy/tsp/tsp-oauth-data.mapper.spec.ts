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
import { schoolFactory } from '@modules/school/testing';
import { systemFactory } from '@modules/system/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from '@shared/domain/interface';
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
				});
				const tspTeachers = [tspTeacher];

				const klasseId = faker.string.uuid();

				const tspClass = robjExportKlasseFactory.build({
					klasseId,
					lehrerUid,
				});
				const tspClasses = [tspClass];

				const tspStudent = robjExportSchuelerFactory.build({
					schuelerUid: faker.string.uuid(),
					schuelerNachname: faker.person.lastName(),
					schuelerVorname: faker.person.firstName(),
					schuleNummer: school.externalId,
					klasseId,
				});
				const tspStudents = [tspStudent];

				const provisioningSystemDto: ProvisioningSystemDto = provisioningSystemDtoFactory.build({
					systemId: system.id,
					provisioningStrategy: SystemProvisioningStrategy.TSP,
				});

				const externalClassDto = externalClassDtoFactory.build({
					externalId: tspClasses[0].klasseId ?? '',
					name: tspClasses[0].klasseName,
				});

				const externalTeacherUserDto = externalUserDtoFactory.build({
					externalId: tspTeachers[0].lehrerUid ?? '',
					firstName: tspTeachers[0].lehrerVorname,
					lastName: tspTeachers[0].lehrerNachname,
					roles: [RoleName.TEACHER],
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

				const expected = [
					oauthDataDtoFactory.build({
						system: provisioningSystemDto,
						externalUser: externalTeacherUserDto,
						externalClasses: [externalClassDto],
						externalSchool: externalSchoolDto,
					}),
					oauthDataDtoFactory.build({
						system: provisioningSystemDto,
						externalUser: externalStudentUserDto,
						externalClasses: [externalClassDto],
						externalSchool: externalSchoolDto,
					}),
				];

				return { system, school, tspTeachers, tspStudents, tspClasses, expected };
			};

			it('should return an array of oauth data dtos', () => {
				const { system, school, tspTeachers, tspStudents, tspClasses, expected } = setup();

				const result = sut.mapTspDataToOauthData(system, [school], tspTeachers, tspStudents, tspClasses);

				expect(result).toStrictEqual(expected);
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
