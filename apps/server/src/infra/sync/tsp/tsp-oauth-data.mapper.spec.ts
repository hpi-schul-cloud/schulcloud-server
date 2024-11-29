import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { schoolFactory } from '../../../modules/school/testing';
import { systemFactory } from '../../../modules/system/testing';
import { BadDataLoggableException } from '../../../modules/provisioning/loggable';
import { RobjExportKlasse, RobjExportLehrer, RobjExportSchueler } from '../../tsp-client';
import { Logger } from '../../../core/logger';
import { SystemProvisioningStrategy, RoleName } from '../../../shared/domain/interface';

import {
	ExternalClassDto,
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	ProvisioningSystemDto,
} from '../../../modules/provisioning';
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
		jest.clearAllMocks();
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

				const provisioningSystemDto = new ProvisioningSystemDto({
					systemId: system.id,
					provisioningStrategy: SystemProvisioningStrategy.TSP,
				});

				const externalSchool = new ExternalSchoolDto({
					externalId: school.externalId ?? '',
				});

				const externalClass = new ExternalClassDto({
					externalId: klasseId,
					name: tspClasses[0].klasseName,
				});

				const expected: OauthDataDto[] = [
					new OauthDataDto({
						system: provisioningSystemDto,
						externalUser: new ExternalUserDto({
							externalId: tspTeachers[0].lehrerUid ?? '',
							firstName: tspTeachers[0].lehrerVorname,
							lastName: tspTeachers[0].lehrerNachname,
							roles: [RoleName.TEACHER],
						}),
						externalSchool,
						externalClasses: [externalClass],
					}),
					new OauthDataDto({
						system: provisioningSystemDto,
						externalUser: new ExternalUserDto({
							externalId: tspStudents[0].schuelerUid ?? '',
							firstName: tspStudents[0].schuelerVorname,
							lastName: tspStudents[0].schuelerNachname,
							roles: [RoleName.STUDENT],
						}),
						externalSchool,
						externalClasses: [externalClass],
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
