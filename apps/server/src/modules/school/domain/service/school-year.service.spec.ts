import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { schoolYearFactory } from '../../testing';
import { SchoolYearRepo, SCHOOL_YEAR_REPO } from '../interface';
import { SchoolYearService } from './school-year.service';

describe('SchoolYearService', () => {
	let service: SchoolYearService;
	let schoolYearRepo: DeepMocked<SchoolYearRepo>;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				SchoolYearService,
				{
					provide: SCHOOL_YEAR_REPO,
					useValue: createMock<SchoolYearRepo>(),
				},
			],
		}).compile();

		service = module.get(SchoolYearService);
		schoolYearRepo = module.get(SCHOOL_YEAR_REPO);
	});

	describe('getAllSchoolYears', () => {
		describe('when multiple school years exist', () => {
			const setup = () => {
				const schoolYears = schoolYearFactory.buildList(3);
				schoolYearRepo.getAllSchoolYears.mockResolvedValueOnce(schoolYears);

				return { schoolYears };
			};

			it('should return all school years', async () => {
				const { schoolYears } = setup();

				const result = await service.getAllSchoolYears();

				expect(result).toEqual(schoolYears);
			});
		});

		describe('when no school years exist', () => {
			const setup = () => {
				const schoolYears = [];
				schoolYearRepo.getAllSchoolYears.mockResolvedValueOnce(schoolYears);
			};

			it('should return an empty array', async () => {
				setup();

				const result = await service.getAllSchoolYears();

				expect(result).toEqual([]);
			});
		});

		describe('when repo throws an error', () => {
			const setup = () => {
				const error = new Error('test');
				schoolYearRepo.getAllSchoolYears.mockRejectedValueOnce(error);

				return { error };
			};

			it('should pass the error', async () => {
				const { error } = setup();

				await expect(() => service.getAllSchoolYears()).rejects.toThrowError(error);
			});
		});
	});
});
