import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, Lesson, SortOrder } from '@shared/domain';
import { CourseRepo, LessonRepo } from '@shared/repo';
import { courseFactory, setupEntities } from '@shared/testing';
import { AuthorizationService } from '@src/modules';
import { CourseUc } from './course.uc';

describe('CourseUc', () => {
	let module: TestingModule;
	let service: CourseUc;
	let courseRepo: DeepMocked<CourseRepo>;
	let lessonRepo: DeepMocked<LessonRepo>;
	let authService: DeepMocked<AuthorizationService>;
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
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
		lessonRepo = module.get(LessonRepo);
		authService = module.get(AuthorizationService);
	});

	afterAll(async () => {
		await orm.close();
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

	describe('exportCourse', () => {
		beforeAll(() => {
			courseRepo.findOne.mockResolvedValue({ name: 'Placeholder' } as Course);
		});

		afterAll(() => {
			courseRepo.findOne.mockRestore();
		});

		it('should return buffer', async () => {
			authService.checkPermissionByReferences.mockImplementationOnce(async () => Promise.resolve());
			lessonRepo.findAllByCourseIds.mockImplementationOnce(async () =>
				Promise.resolve([
					[
						{
							id: 'placeholder-id',
							name: 'placeholder-name',
						} as Lesson,
					],
					0,
				])
			);

			await expect(service.exportCourse('courseId', 'userId')).resolves.toBeInstanceOf(Buffer);
		});

		it('should throw if user can not edit course', async () => {
			authService.checkPermissionByReferences.mockImplementationOnce(() => {
				throw new Error();
			});

			await expect(service.exportCourse('courseId', 'userId')).rejects.toThrow();
		});
	});
});
