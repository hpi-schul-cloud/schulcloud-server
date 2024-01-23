import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { IFindOptions, SortOrder } from '@shared/domain/interface';
import { systemFactory } from '@shared/testing';
import { SystemService } from '@src/modules/system';
import { schoolFactory } from '../../testing';
import { SchoolProps } from '../do';
import { SchoolRepo } from '../interface';
import { SchoolQuery } from '../query';
import { SchoolService } from './school.service';

describe('SchoolService', () => {
	let service: SchoolService;
	let schoolRepo: DeepMocked<SchoolRepo>;
	let configService: DeepMocked<ConfigService>;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				SchoolService,
				{
					provide: 'SCHOOL_REPO',
					useValue: createMock<SchoolRepo>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
			],
		}).compile();

		service = module.get(SchoolService);
		schoolRepo = module.get('SCHOOL_REPO');
		configService = module.get(ConfigService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('getSchoolById', () => {
		describe('when repo returns a school', () => {
			const setup = () => {
				const school = schoolFactory.build();
				schoolRepo.getSchoolById.mockResolvedValueOnce(school);

				return { school, id: school.id };
			};

			it('should return this school', async () => {
				const { school, id } = setup();

				const result = await service.getSchoolById(id);

				expect(result).toEqual(school);
			});
		});

		describe('when STUDENT_TEAM_CREATION config value is "enabled"', () => {
			const setup = () => {
				const school = schoolFactory.build();
				schoolRepo.getSchoolById.mockResolvedValueOnce(school);

				configService.get.mockReturnValueOnce('enabled');

				return { school, id: school.id };
			};

			it('should add IS_TEAM_CREATION_BY_STUDENTS_ENABLED feature', async () => {
				const { school, id } = setup();

				const result = await service.getSchoolById(id);

				expect(result).toEqual(school);
				expect(result.getProps().features).toContain('isTeamCreationByStudentsEnabled');
			});
		});

		describe('when STUDENT_TEAM_CREATION config value is "disabled"', () => {
			const setup = () => {
				const school = schoolFactory.build();
				schoolRepo.getSchoolById.mockResolvedValueOnce(school);

				configService.get.mockReturnValueOnce('disabled');

				return { school, id: school.id };
			};

			it('should not add IS_TEAM_CREATION_BY_STUDENTS_ENABLED feature', async () => {
				const { school, id } = setup();

				const result = await service.getSchoolById(id);

				expect(result).toEqual(school);
				expect(result.getProps().features).not.toContain('isTeamCreationByStudentsEnabled');
			});
		});

		describe('when STUDENT_TEAM_CREATION config value is "opt-in" and enableStudentTeamCreation is true', () => {
			const setup = () => {
				const school = schoolFactory.build({ enableStudentTeamCreation: true });
				schoolRepo.getSchoolById.mockResolvedValueOnce(school);

				configService.get.mockReturnValueOnce('opt-in');

				return { school, id: school.id };
			};

			it('should add IS_TEAM_CREATION_BY_STUDENTS_ENABLED feature', async () => {
				const { school, id } = setup();

				const result = await service.getSchoolById(id);

				expect(result).toEqual(school);
				expect(result.getProps().features).toContain('isTeamCreationByStudentsEnabled');
			});
		});

		describe('when STUDENT_TEAM_CREATION config value is "opt-in" and enableStudentTeamCreation is false', () => {
			const setup = () => {
				const school = schoolFactory.build({ enableStudentTeamCreation: false });
				schoolRepo.getSchoolById.mockResolvedValueOnce(school);

				configService.get.mockReturnValueOnce('opt-in');

				return { school, id: school.id };
			};

			it('should not add IS_TEAM_CREATION_BY_STUDENTS_ENABLED feature', async () => {
				const { school, id } = setup();

				const result = await service.getSchoolById(id);

				expect(result).toEqual(school);
				expect(result.getProps().features).not.toContain('isTeamCreationByStudentsEnabled');
			});
		});

		describe('when STUDENT_TEAM_CREATION config value is "opt-in" and enableStudentTeamCreation is undefined', () => {
			const setup = () => {
				const school = schoolFactory.build({ enableStudentTeamCreation: undefined });
				schoolRepo.getSchoolById.mockResolvedValueOnce(school);

				configService.get.mockReturnValueOnce('opt-in');

				return { school, id: school.id };
			};

			it('should not add IS_TEAM_CREATION_BY_STUDENTS_ENABLED feature', async () => {
				const { school, id } = setup();

				const result = await service.getSchoolById(id);

				expect(result).toEqual(school);
				expect(result.getProps().features).not.toContain('isTeamCreationByStudentsEnabled');
			});
		});

		describe('when STUDENT_TEAM_CREATION config value is "opt-out" and enableStudentTeamCreation is true', () => {
			const setup = () => {
				const school = schoolFactory.build({ enableStudentTeamCreation: true });
				schoolRepo.getSchoolById.mockResolvedValueOnce(school);

				configService.get.mockReturnValueOnce('opt-out');

				return { school, id: school.id };
			};

			it('should add IS_TEAM_CREATION_BY_STUDENTS_ENABLED feature', async () => {
				const { school, id } = setup();

				const result = await service.getSchoolById(id);

				expect(result).toEqual(school);
				expect(result.getProps().features).toContain('isTeamCreationByStudentsEnabled');
			});
		});

		describe('when STUDENT_TEAM_CREATION config value is "opt-out" and enableStudentTeamCreation is false', () => {
			const setup = () => {
				const school = schoolFactory.build({ enableStudentTeamCreation: false });
				schoolRepo.getSchoolById.mockResolvedValueOnce(school);

				configService.get.mockReturnValueOnce('opt-out');

				return { school, id: school.id };
			};

			it('should not add IS_TEAM_CREATION_BY_STUDENTS_ENABLED feature', async () => {
				const { school, id } = setup();

				const result = await service.getSchoolById(id);

				expect(result).toEqual(school);
				expect(result.getProps().features).not.toContain('isTeamCreationByStudentsEnabled');
			});
		});

		describe('when STUDENT_TEAM_CREATION config value is "opt-out" and enableStudentTeamCreation is undefined', () => {
			const setup = () => {
				const school = schoolFactory.build({ enableStudentTeamCreation: undefined });
				schoolRepo.getSchoolById.mockResolvedValueOnce(school);

				configService.get.mockReturnValueOnce('opt-out');

				return { school, id: school.id };
			};

			it('should add IS_TEAM_CREATION_BY_STUDENTS_ENABLED feature', async () => {
				const { school, id } = setup();

				const result = await service.getSchoolById(id);

				expect(result).toEqual(school);
				expect(result.getProps().features).toContain('isTeamCreationByStudentsEnabled');
			});
		});
	});

	describe('getSchools', () => {
		describe('when repo returns schools', () => {
			const setup = () => {
				const query: SchoolQuery = {};

				const schools = schoolFactory.buildList(3);
				schoolRepo.getSchools.mockResolvedValueOnce(schools);

				return { query, schools };
			};

			it('should return these schools', async () => {
				const { query, schools } = setup();

				const result = await service.getSchools(query);

				expect(result).toEqual(schools);
			});
		});

		describe('when schools exist and query but no options are passed', () => {
			const setup = () => {
				const query: SchoolQuery = { federalStateId: '1' };

				const schools = schoolFactory.buildList(3);
				schoolRepo.getSchools.mockResolvedValueOnce(schools);

				return { query };
			};

			it('should pass query to repo', async () => {
				const { query } = setup();

				await service.getSchools(query);

				expect(schoolRepo.getSchools).toBeCalledWith(query, undefined);
			});
		});

		describe('when schools exist and query and options are passed', () => {
			const setup = () => {
				const query: SchoolQuery = {};
				const options: IFindOptions<SchoolProps> = {
					pagination: { limit: 10, skip: 0 },
					order: { name: SortOrder.asc },
				};

				const schools = schoolFactory.buildList(3);
				schoolRepo.getSchools.mockResolvedValueOnce(schools);

				return { query, options };
			};

			it('should pass query and options to repo', async () => {
				const { query, options } = setup();

				await service.getSchools(query, options);

				expect(schoolRepo.getSchools).toBeCalledWith(query, options);
			});
		});

		describe('when no schools exist', () => {
			const setup = () => {
				const query: SchoolQuery = {};

				const schools = [];
				schoolRepo.getSchools.mockResolvedValueOnce(schools);

				return { query, schools };
			};

			it('should return empty array', async () => {
				const { query, schools } = setup();

				const result = await service.getSchools(query);

				expect(result).toEqual(schools);
			});
		});
	});

	describe('getSchoolsForExternalInvite', () => {
		describe('when some schools exist that are eligible for external invite', () => {
			const setup = () => {
				const query = {};
				const schools = schoolFactory.buildList(2);
				jest.spyOn(schools[0], 'isEligibleForExternalInvite').mockReturnValueOnce(true);
				jest.spyOn(schools[1], 'isEligibleForExternalInvite').mockReturnValueOnce(false);

				schoolRepo.getSchools.mockResolvedValueOnce(schools);

				return { query, schools };
			};

			it('should return these schools', async () => {
				const { query, schools } = setup();

				const result = await service.getSchoolsForExternalInvite(query, 'ownSchoolId');

				expect(result).toEqual([schools[0]]);
			});
		});
	});

	describe('doesSchoolExist', () => {
		describe('when school exists', () => {
			const setup = () => {
				const school = schoolFactory.build();
				schoolRepo.getSchoolById.mockResolvedValueOnce(school);

				return { id: school.id };
			};

			it('should return true', async () => {
				const { id } = setup();

				const result = await service.doesSchoolExist(id);

				expect(result).toEqual(true);
			});
		});

		describe('when school does not exist', () => {
			const setup = () => {
				const id = '1';
				schoolRepo.getSchoolById.mockRejectedValueOnce(new NotFoundException());

				return { id };
			};

			it('should return false', async () => {
				const { id } = setup();

				const result = await service.doesSchoolExist(id);

				expect(result).toEqual(false);
			});
		});

		describe('when school repo throws any other error than NotFoundException', () => {
			const setup = () => {
				const id = '1';
				schoolRepo.getSchoolById.mockRejectedValueOnce(new Error());

				return { id };
			};

			it('should throw this error', async () => {
				const { id } = setup();

				await expect(service.doesSchoolExist(id)).rejects.toThrowError();
			});
		});
	});

	describe('getSchoolsForLdapLogin', () => {
		describe('when some schools exist that have an active ldap system', () => {
			const setup = () => {
				const query = {};
				const activeLdapSystem = systemFactory.build();
				jest.spyOn(activeLdapSystem, 'isActiveLdapSystem').mockReturnValueOnce(true);
				const schoolWithActiveLdapSystem = schoolFactory.build({ systemIds: [activeLdapSystem.id] });

				const otherSystem = systemFactory.build();
				jest.spyOn(activeLdapSystem, 'isActiveLdapSystem').mockReturnValueOnce(false);
				const schoolWithOtherSystem = schoolFactory.build({ systemIds: [otherSystem.id] });

				const schoolWithoutSystem = schoolFactory.build();

				schoolRepo.getSchools.mockResolvedValueOnce([
					schoolWithActiveLdapSystem,
					schoolWithOtherSystem,
					schoolWithoutSystem,
				]);

				return { query, schoolWithActiveLdapSystem };
			};

			it('should return these schools', async () => {
				const { query, schoolWithActiveLdapSystem } = setup();

				const result = await service.getSchoolsForLdapLogin(query);

				expect(result).toEqual([schoolWithActiveLdapSystem]);
			});
		});
	});
});
