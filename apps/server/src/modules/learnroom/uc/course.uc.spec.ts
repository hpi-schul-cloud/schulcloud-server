import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { SortOrder } from '@shared/domain';
import { CourseRepo, LessonRepo } from '@shared/repo';
import { courseFactory, setupEntities } from '@shared/testing';
import { AuthorizationService } from '@src/modules';
import { CourseUc } from './course.uc';

describe('CourseUc', () => {
	let module: TestingModule;
	let service: CourseUc;
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
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		service = module.get(CourseUc);
		courseRepo = module.get(CourseRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findByUser', () => {
		it('should return courses of user', async () => {
			const courses = courseFactory.buildList(5);
			courseRepo.findAllByUserId.mockResolvedValue([courses, 5]);

			const [array, count] = await service.findAllByUser('someUserId');
			expect(count).toEqual(5);
			expect(array).toEqual(courses);
		});

		it('should pass on options correctly', async () => {
			const courses = courseFactory.buildList(5);
			const spy = courseRepo.findAllByUserId.mockResolvedValue([courses, 5]);

			const pagination = { skip: 1, limit: 2 };
			const resultingOptions = { pagination, order: { updatedAt: SortOrder.desc } };

			await service.findAllByUser('someUserId', pagination);

			expect(spy).toHaveBeenCalledWith('someUserId', {}, resultingOptions);
		});
	});
});
