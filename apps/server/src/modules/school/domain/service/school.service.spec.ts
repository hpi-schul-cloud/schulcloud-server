import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { IFindOptions, SortOrder } from '@shared/domain/interface';
import { systemFactory } from '@shared/testing';
import { SystemService } from '@src/modules/system';
import { schoolFactory } from '../../testing';
import { SchoolForLdapLogin, SchoolProps, SystemForLdapLogin } from '../do';
import { SchoolFactory } from '../factory';
import { SchoolRepo } from '../interface';
import { SchoolQuery } from '../query';
import { SchoolService } from './school.service';

describe('SchoolService', () => {
	let service: SchoolService;
	let schoolRepo: DeepMocked<SchoolRepo>;
	let systemService: DeepMocked<SystemService>;
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
		systemService = module.get(SystemService);
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
				expect(result.getProps().instanceFeatures).toContain('isTeamCreationByStudentsEnabled');
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
				expect(result.getProps().instanceFeatures).toContain('isTeamCreationByStudentsEnabled');
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
				expect(result.getProps().instanceFeatures).toContain('isTeamCreationByStudentsEnabled');
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
				expect(result.getProps().instanceFeatures).toContain('isTeamCreationByStudentsEnabled');
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
		describe('when some schools exist that have ldap login systems', () => {
			const setup = () => {
				const ldapLoginSystem = systemFactory.build({ type: 'ldap', ldapConfig: { active: true } });
				const otherSystem = systemFactory.build({ type: 'oauth2' });
				const schoolWithLdapLoginSystem = schoolFactory.build({ systemIds: [ldapLoginSystem.id] });

				systemService.findAllForLdapLogin.mockResolvedValueOnce([ldapLoginSystem, otherSystem]);
				schoolRepo.getSchoolsBySystemIds.mockResolvedValueOnce([schoolWithLdapLoginSystem]);

				const expected = new SchoolForLdapLogin({
					id: schoolWithLdapLoginSystem.id,
					name: schoolWithLdapLoginSystem.getProps().name,
					systems: [
						new SystemForLdapLogin({
							id: ldapLoginSystem.id,
							type: ldapLoginSystem.getProps().type,
							alias: ldapLoginSystem.getProps().alias,
						}),
					],
				});

				return { expected };
			};

			it('should return these schools', async () => {
				const { expected } = setup();

				const result = await service.getSchoolsForLdapLogin();

				expect(result).toEqual([expected]);
			});
		});

		describe('when a school has several systems', () => {
			const setup = () => {
				const ldapLoginSystem = systemFactory.build({ type: 'ldap', ldapConfig: { active: true } });
				const otherSystem = systemFactory.build({ type: 'oauth2' });
				const school = schoolFactory.build({ systemIds: [ldapLoginSystem.id, otherSystem.id] });

				systemService.findAllForLdapLogin.mockResolvedValueOnce([ldapLoginSystem]);
				schoolRepo.getSchoolsBySystemIds.mockResolvedValueOnce([school]);

				const expected = new SchoolForLdapLogin({
					id: school.id,
					name: school.getProps().name,
					systems: [
						new SystemForLdapLogin({
							id: ldapLoginSystem.id,
							type: ldapLoginSystem.getProps().type,
							alias: ldapLoginSystem.getProps().alias,
						}),
					],
				});

				return { expected };
			};

			it('should return the school with only the LDAP login systems', async () => {
				const { expected } = setup();

				const result = await service.getSchoolsForLdapLogin();

				expect(result).toEqual([expected]);
			});
		});
	});

	describe('updateSchool', () => {
		describe('when school exists and save is successfull', () => {
			const setup = () => {
				const school = schoolFactory.build();
				schoolRepo.getSchoolById.mockResolvedValueOnce(school);
				configService.get.mockReturnValue('enabled');

				return { school, id: school.id };
			};

			it('should call getSchoolById', async () => {
				const { id } = setup();

				await service.updateSchool(id, {});

				expect(schoolRepo.getSchoolById).toBeCalledWith(id);
			});

			it('should call save', async () => {
				const { id, school } = setup();
				const partialBody = { name: 'new name' };

				const updatedSchool = SchoolFactory.buildFromPartialBody(school, partialBody);
				schoolRepo.save.mockResolvedValueOnce(updatedSchool);

				await service.updateSchool(id, partialBody);

				expect(schoolRepo.save).toHaveBeenCalledWith(updatedSchool);
			});

			it('should return the updated school', async () => {
				const { id, school } = setup();
				const partialBody = { name: 'new name' };

				const updatedSchool = SchoolFactory.buildFromPartialBody(school, partialBody);
				schoolRepo.save.mockResolvedValueOnce(updatedSchool);

				const result = await service.updateSchool(id, partialBody);

				expect(result).toEqual(updatedSchool);
			});
		});

		describe('when school does not exist', () => {
			const setup = () => {
				const id = '1';
				schoolRepo.getSchoolById.mockRejectedValueOnce(new NotFoundException());

				return { id };
			};

			it('should throw NotFoundException', async () => {
				const { id } = setup();

				await expect(service.updateSchool(id, {})).rejects.toThrowError(NotFoundException);
			});
		});

		describe('when school repo save throws error', () => {
			const setup = () => {
				const school = schoolFactory.build();
				const error = new Error('saveError');
				schoolRepo.getSchoolById.mockResolvedValueOnce(school);
				schoolRepo.save.mockRejectedValueOnce(error);

				return { id: school.id, error };
			};

			it('should throw this error', async () => {
				const { id, error } = setup();

				await expect(service.updateSchool(id, {})).rejects.toThrowError(error);
			});
		});
	});

	describe('getSchoolSystems', () => {
		describe('when school has systems', () => {
			const setup = () => {
				const school = schoolFactory.build({ systemIds: ['1', '2'] });
				const systems = systemFactory.buildList(2);

				schoolRepo.getSchoolById.mockResolvedValueOnce(school);
				systemService.getSystems.mockResolvedValueOnce(systems);

				return { school, systems };
			};

			it('should call systemService.getSystems with expected props', async () => {
				const { school } = setup();

				await service.getSchoolSystems(school);

				expect(systemService.getSystems).toBeCalledWith(['1', '2']);
			});

			it('should return these systems', async () => {
				const { school, systems } = setup();

				const result = await service.getSchoolSystems(school);

				expect(result).toEqual(systems);
			});
		});

		describe('when school has no systems', () => {
			const setup = () => {
				const school = schoolFactory.build({ systemIds: [] });

				schoolRepo.getSchoolById.mockResolvedValueOnce(school);

				return { school };
			};

			it('should dont call systemService.getSystems', async () => {
				const { school } = setup();

				await service.getSchoolSystems(school);

				expect(systemService.getSystems).not.toBeCalled();
			});

			it('should return empty array', async () => {
				const { school } = setup();

				const result = await service.getSchoolSystems(school);

				expect(result).toEqual([]);
			});
		});

		describe('when systemService.getSystems throws error', () => {
			const setup = () => {
				const school = schoolFactory.build({ systemIds: ['1'] });
				systemService.getSystems.mockRejectedValueOnce(new NotFoundException());

				return { school };
			};

			it('should throw NotFoundException', async () => {
				const { school } = setup();

				await expect(service.getSchoolSystems(school)).rejects.toThrowError(NotFoundException);
			});
		});
	});
});
