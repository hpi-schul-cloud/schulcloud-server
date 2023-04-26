import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SortOrder } from '@shared/domain';
import { CourseRepo, LessonRepo } from '@shared/repo';
import { courseFactory, setupEntities } from '@shared/testing';
import { AuthorizationService } from '@src/modules';
import { CourseUc } from './course.uc';

describe('CourseUc', () => {
	let module: TestingModule;
	let uc: CourseUc;
	let courseRepo: DeepMocked<CourseRepo>;
	let authorizationService: DeepMocked<AuthorizationService>;

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

		uc = module.get(CourseUc);
		courseRepo = module.get(CourseRepo);
		authorizationService = module.get(AuthorizationService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findAllByUser', () => {
		it('should return courses of user', async () => {
			const courses = courseFactory.buildList(5);
			courseRepo.findAllByUserId.mockResolvedValue([courses, 5]);

			const [array, count] = await uc.findAllByUser('someUserId');
			expect(count).toEqual(5);
			expect(array).toEqual(courses);
		});

		it('should pass on options correctly', async () => {
			const courses = courseFactory.buildList(5);
			const spy = courseRepo.findAllByUserId.mockResolvedValue([courses, 5]);

			const pagination = { skip: 1, limit: 2 };
			const resultingOptions = { pagination, order: { updatedAt: SortOrder.desc } };

			await uc.findAllByUser('someUserId', pagination);

			expect(spy).toHaveBeenCalledWith('someUserId', {}, resultingOptions);
		});
	});
	describe('getCourseForTeacher', () => {
		beforeEach(() => {});
		afterEach(() => {});
		it('should return course for teacher', async () => {
			const course = courseFactory.build();
			courseRepo.findOneForTeacherOrSubstitueTeacher.mockResolvedValue(course);

			const result = await uc.getCourseForTeacher('someUserId', 'someCourseId');

			expect(result).toEqual(course);
		});
		// TODO: it should check permissions for editing course
		it('should throw error if user has no permission to edit course', async () => {
			authorizationService.hasPermission.mockReturnValue(false);
			await expect(async () => {
				await uc.getCourseForTeacher('someUserId', 'someCourseId');
			}).rejects.toThrow(ForbiddenException);
		});
	});
});
