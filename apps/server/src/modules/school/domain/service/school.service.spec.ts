import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { IFindOptions, SortOrder } from '@shared/domain/interface';
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

				return { school };
			};

			it('should return this school', async () => {
				const { school } = setup();

				const result = await service.getSchoolById('1');

				expect(result).toEqual(school);
			});
		});

		describe('when STUDENT_TEAM_CREATION config value is "enabled"', () => {
			const setup = () => {
				const school = schoolFactory.build();
				schoolRepo.getSchoolById.mockResolvedValueOnce(school);

				configService.get.mockReturnValueOnce('enabled');

				return { school };
			};

			it('should add IS_TEAM_CREATION_BY_STUDENTS_ENABLED feature', async () => {
				const { school } = setup();

				const result = await service.getSchoolById('1');

				expect(result).toEqual(school);
				expect(result.getProps().features).toContain('isTeamCreationByStudentsEnabled');
			});
		});

		describe('when STUDENT_TEAM_CREATION config value is "disabled"', () => {
			const setup = () => {
				const school = schoolFactory.build();
				schoolRepo.getSchoolById.mockResolvedValueOnce(school);

				configService.get.mockReturnValueOnce('disabled');

				return { school };
			};

			it('should remove IS_TEAM_CREATION_BY_STUDENTS_ENABLED feature', async () => {
				const { school } = setup();

				const result = await service.getSchoolById('1');

				expect(result).toEqual(school);
				expect(result.getProps().features).not.toContain('isTeamCreationByStudentsEnabled');
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
});
