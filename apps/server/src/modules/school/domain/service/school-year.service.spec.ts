import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { schoolYearFactory } from '../testing';
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
		it('should return all school years', async () => {
			const schoolYears = schoolYearFactory.buildList(3);
			schoolYearRepo.getAllSchoolYears.mockResolvedValueOnce(schoolYears);

			const result = await service.getAllSchoolYears();

			expect(result).toEqual(schoolYears);
		});
	});
});
