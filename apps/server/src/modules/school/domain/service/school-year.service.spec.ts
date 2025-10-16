import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { SchoolYearEntity, SchoolYearMikroOrmRepo } from '@modules/school/repo';
import { schoolYearDoFactory, schoolYearEntityFactory } from '@modules/school/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { SCHOOL_YEAR_REPO } from '../interface';
import { SchoolYearService } from './school-year.service';

describe('SchoolYearService', () => {
	let service: SchoolYearService;
	let schoolYearRepo: DeepMocked<SchoolYearMikroOrmRepo>;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				SchoolYearService,
				{
					provide: SCHOOL_YEAR_REPO,
					useValue: createMock<SchoolYearMikroOrmRepo>(),
				},
			],
		}).compile();

		service = module.get(SchoolYearService);
		schoolYearRepo = module.get(SCHOOL_YEAR_REPO);
	});

	describe('getAllSchoolYears', () => {
		describe('when multiple school years exist', () => {
			const setup = () => {
				const schoolYears = schoolYearDoFactory.buildList(3);
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

	describe('getCurrentSchoolYear', () => {
		const setup = () => {
			const schoolYear: SchoolYearEntity = schoolYearEntityFactory.build({
				startDate: new Date('2021-09-01'),
				endDate: new Date('2022-12-31'),
			});
			schoolYearRepo.findCurrentYear.mockResolvedValue(schoolYear);

			return {
				schoolYear,
			};
		};

		describe('when called', () => {
			it('should return the current school year', async () => {
				const { schoolYear } = setup();

				const currentSchoolYear: SchoolYearEntity = await service.getCurrentSchoolYear();

				expect(currentSchoolYear).toEqual(schoolYear);
			});
		});
	});

	describe('getCurrentOrNextSchoolYear', () => {
		const setup = () => {
			const schoolYear: SchoolYearEntity = schoolYearEntityFactory.build({
				startDate: new Date('2021-09-01'),
				endDate: new Date('2022-12-31'),
			});
			schoolYearRepo.findCurrentOrNextYear.mockResolvedValue(schoolYear);

			return {
				schoolYear,
			};
		};

		describe('when called', () => {
			it('should return the current school year', async () => {
				const { schoolYear } = setup();

				const currentSchoolYear: SchoolYearEntity = await service.getCurrentOrNextSchoolYear();

				expect(currentSchoolYear).toEqual(schoolYear);
			});
		});
	});

	describe('findById', () => {
		const setup = () => {
			const schoolYear: SchoolYearEntity = schoolYearEntityFactory.build({
				startDate: new Date('2021-09-01'),
				endDate: new Date('2022-12-31'),
			});

			schoolYearRepo.findById.mockResolvedValue(schoolYear);

			return {
				schoolYear,
			};
		};

		describe('when called', () => {
			it('should return the current school year', async () => {
				const { schoolYear } = setup();

				const currentSchoolYear: SchoolYearEntity = await service.findById(schoolYear.id);

				expect(currentSchoolYear).toEqual(schoolYear);
			});
		});
	});
});
