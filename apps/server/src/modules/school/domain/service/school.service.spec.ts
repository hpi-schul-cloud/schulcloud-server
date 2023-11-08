import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { SortOrder } from '@shared/domain';
import { ObjectId } from 'bson';
import { schoolFactory } from '../../testing/school.factory';
import { SchoolRepo } from '../interface';
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

	describe('getSchool', () => {
		it('should return school', async () => {
			const school = schoolFactory.build();
			schoolRepo.getSchool.mockResolvedValueOnce(school);

			const result = await service.getSchool('1');

			expect(result).toEqual(school);
		});

		describe('when STUDENT_TEAM_CREATION config value is "enabled"', () => {
			const setup = () => {
				const school = schoolFactory.build();
				schoolRepo.getSchool.mockResolvedValueOnce(school);

				configService.get.mockReturnValueOnce('enabled');

				return { school };
			};

			it('should add IS_TEAM_CREATION_BY_STUDENTS_ENABLED feature', async () => {
				const { school } = setup();

				const result = await service.getSchool('1');

				expect(result).toEqual(school);
				expect(result.getProps().features).toContain('isTeamCreationByStudentsEnabled');
			});
		});

		describe('when STUDENT_TEAM_CREATION config value is "disabled"', () => {
			const setup = () => {
				const school = schoolFactory.build();
				schoolRepo.getSchool.mockResolvedValueOnce(school);

				configService.get.mockReturnValueOnce('disabled');

				return { school };
			};

			it('should remove IS_TEAM_CREATION_BY_STUDENTS_ENABLED feature', async () => {
				const { school } = setup();

				const result = await service.getSchool('1');

				expect(result).toEqual(school);
				expect(result.getProps().features).not.toContain('isTeamCreationByStudentsEnabled');
			});
		});
	});

	describe('getAllSchools', () => {
		it('should return all schools', async () => {
			const schools = schoolFactory.buildList(3);
			schoolRepo.getAllSchools.mockResolvedValueOnce(schools);

			const result = await service.getAllSchools({});

			expect(result).toEqual(schools);
		});

		it('should pass query to repo', async () => {
			const schools = schoolFactory.buildList(3);
			schoolRepo.getAllSchools.mockResolvedValueOnce(schools);
			const query = { federalStateId: new ObjectId().toHexString() };

			await service.getAllSchools(query);

			expect(schoolRepo.getAllSchools).toBeCalledWith(query, undefined);
		});

		it('should pass find options to repo', async () => {
			const schools = schoolFactory.buildList(3);
			schoolRepo.getAllSchools.mockResolvedValueOnce(schools);
			const options = { pagination: { limit: 10, offset: 0 }, order: { name: SortOrder.asc } };

			await service.getAllSchools({}, options);

			expect(schoolRepo.getAllSchools).toBeCalledWith(expect.anything(), options);
		});
	});

	describe('getAllSchoolsExceptOwnSchool', () => {
		it('should return all schools except own school', async () => {
			const ownSchool = schoolFactory.build();
			const foreignSchools = schoolFactory.buildList(3);
			schoolRepo.getAllSchools.mockResolvedValueOnce([ownSchool, ...foreignSchools]);

			const result = await service.getAllSchoolsExceptOwnSchool({}, ownSchool.id);

			expect(result).toEqual(foreignSchools);
		});
	});
});
