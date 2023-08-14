import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { SortOrder } from '@shared/domain';
import { CourseRepo, LessonRepo } from '@shared/repo';
import { courseFactory, setupEntities } from '@shared/testing';
import { CourseUc } from './course.uc';

describe('CourseUc', () => {
	let module: TestingModule;
	let uc: CourseUc;
	let courseRepo: DeepMocked<CourseRepo>;

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				CourseUc,
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
				{
					provide: LessonRepo,
					useValue: createMock<LessonRepo>(),
				},
			],
		}).compile();

		uc = module.get(CourseUc);
		courseRepo = module.get(CourseRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findAllByUser', () => {
		const setup = () => {
			const courses = courseFactory.buildList(5);
			const pagination = { skip: 1, limit: 2 };

			return { courses, pagination };
		};
		it('should return courses of user', async () => {
			const { courses } = setup();

			courseRepo.findAllByUserId.mockResolvedValueOnce([courses, 5]);
			const [array, count] = await uc.findAllByUser('someUserId');

			expect(count).toEqual(5);
			expect(array).toEqual(courses);
		});

		it('should pass on options correctly', async () => {
			const { pagination } = setup();

			const resultingOptions = { pagination, order: { updatedAt: SortOrder.desc } };
			await uc.findAllByUser('someUserId', pagination);
			expect(courseRepo.findAllByUserId).toHaveBeenCalledWith('someUserId', {}, resultingOptions);
		});
	});
});
