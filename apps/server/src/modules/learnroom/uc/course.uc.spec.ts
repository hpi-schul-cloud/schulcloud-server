import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, SortOrder } from '@shared/domain';
import { CourseRepo } from '@shared/repo';
import { courseFactory, setupEntities } from '@shared/testing';
import { CourseUc } from './course.uc';

describe('CourseUc', () => {
	let service: CourseUc;
	let repo: DeepMocked<CourseRepo>;
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CourseUc,
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
			],
		}).compile();

		service = module.get(CourseUc);
		repo = module.get(CourseRepo);
	});

	describe('findByUser', () => {
		it('should return courses of user', async () => {
			const courses = courseFactory.buildList(5);
			repo.findAllByUserId.mockResolvedValue([courses, 5]);

			const [array, count] = await service.findAllByUser('someUserId');
			expect(count).toEqual(5);
			expect(array).toEqual(courses);
		});

		it('should pass on options correctly', async () => {
			const courses = courseFactory.buildList(5);
			const spy = repo.findAllByUserId.mockResolvedValue([courses, 5]);

			const pagination = { skip: 1, limit: 2 };
			const resultingOptions = { pagination, order: { updatedAt: SortOrder.desc } };

			await service.findAllByUser('someUserId', pagination);

			expect(spy).toHaveBeenCalledWith('someUserId', {}, resultingOptions);
		});
	});

	describe('exportCourse', () => {
		it('should create readable stream', async () => {
			repo.findOne.mockResolvedValueOnce({ name: 'Placeholder' } as Course);

			await expect(service.exportCourse('courseId', 'userId')).resolves.toBeDefined();
			expect(repo.findOne).toBeCalledTimes(1);
		});
	});
});
