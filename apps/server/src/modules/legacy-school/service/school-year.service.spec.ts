import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolYearEntity } from '@shared/domain/entity';
import { setupEntities } from '@shared/testing';
import { schoolYearFactory } from '@shared/testing/factory/schoolyear.factory';
import { SchoolYearRepo } from '../repo';
import { SchoolYearService } from './school-year.service';

describe('SchoolYearService', () => {
	let module: TestingModule;
	let service: SchoolYearService;

	let schoolYearRepo: DeepMocked<SchoolYearRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolYearService,
				{
					provide: SchoolYearRepo,
					useValue: createMock<SchoolYearRepo>(),
				},
			],
		}).compile();

		service = module.get(SchoolYearService);
		schoolYearRepo = module.get(SchoolYearRepo);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getCurrentSchoolYear', () => {
		const setup = () => {
			const schoolYear: SchoolYearEntity = schoolYearFactory.build({
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
			const schoolYear: SchoolYearEntity = schoolYearFactory.build({
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
			const schoolYear: SchoolYearEntity = schoolYearFactory.build({
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
