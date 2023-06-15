import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { setupEntities } from '@shared/testing';
import { schoolYearFactory } from '@shared/testing/factory/schoolyear.factory';
import { SchoolYear } from '@shared/domain';
import { SchoolYearService } from './school-year.service';
import { SchoolYearRepo } from '../repo';

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
			jest.setSystemTime(new Date('2022-06-01').getTime());
			const schoolYear: SchoolYear = schoolYearFactory.build({
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

				const currentSchoolYear: SchoolYear = await service.getCurrentSchoolYear();

				expect(currentSchoolYear).toEqual(schoolYear);
			});
		});
	});
});
