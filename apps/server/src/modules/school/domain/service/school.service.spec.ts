import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { IFindOptions, SortOrder } from '@shared/domain/interface';
import { SchoolPurpose } from '@shared/domain/types';
import { ObjectId } from 'bson';
import { SchoolRepo } from '../interface';
import { schoolFactory } from '../../testing';
import { SchoolService } from './school.service';
import { SchoolQuery } from '../query';
import { SchoolProps } from '../do';

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
		describe('when school from given id exists', () => {
			const setup = () => {
				const school = schoolFactory.build();
				schoolRepo.getSchoolById.mockResolvedValueOnce(school);

				return { school, id: school.id };
			};

			it('should return school', async () => {
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
		describe('when schools exists and no query or options are passed', () => {
			const setup = () => {
				const query: SchoolQuery = {};
				const options: IFindOptions<SchoolProps> = {};

				const schools = schoolFactory.buildList(3);
				schoolRepo.getSchools.mockResolvedValueOnce(schools);

				return { query, options, schools };
			};

			it('should return all schools', async () => {
				const { query, options, schools } = setup();

				const result = await service.getSchools(query, options);

				expect(result).toEqual(schools);
			});
		});

		describe('when schools exists and query but no options are passed', () => {
			const setup = () => {
				const query: SchoolQuery = { federalStateId: new ObjectId().toHexString() };
				const options = undefined;

				const schools = schoolFactory.buildList(3);
				schoolRepo.getSchools.mockResolvedValueOnce(schools);

				return { query, options };
			};

			it('should pass query to repo', async () => {
				const { query, options } = setup();

				await service.getSchools(query, options);

				expect(schoolRepo.getSchools).toBeCalledWith(query, undefined);
			});
		});

		describe('when schools exists and query is empty but options are passed', () => {
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

			it('should pass find options to repo', async () => {
				const { query, options } = setup();

				await service.getSchools(query, options);

				expect(schoolRepo.getSchools).toBeCalledWith(expect.anything(), options);
			});
		});
	});

	describe('getSchoolsForExternalInvite', () => {
		// TODO: Update tests!
		describe('....describe is missed', () => {
			const setup = () => {
				const query = {};
				const ownSchool = schoolFactory.build();
				const foreignSchools = schoolFactory.buildList(3);
				const foreignExpertSchool = schoolFactory.build({ purpose: SchoolPurpose.EXPERT });
				schoolRepo.getSchools.mockResolvedValueOnce([ownSchool, ...foreignSchools, foreignExpertSchool]);

				return { query, foreignSchools, ownSchoolId: ownSchool.id };
			};

			it('should return all schools for external invite', async () => {
				const { query, foreignSchools, ownSchoolId } = setup();

				const result = await service.getSchoolsForExternalInvite(query, ownSchoolId);

				expect(result).toEqual(foreignSchools);
			});
		});
	});
});
