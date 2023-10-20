import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, Permission, SortOrder } from '@shared/domain';
import { CourseRepo, LessonRepo } from '@shared/repo';
import { courseFactory, setupEntities, userFactory } from '@shared/testing';
import { AuthorizationService } from '@src/modules';
import { AuthorizationContextBuilder } from '@src/modules/authorization';
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
	describe('getCourse', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const course = courseFactory.build();
			return { user, course };
		};
		it('should return course for teacher', async () => {
			const { user, course } = setup();

			courseRepo.findOneForTeacherOrSubstituteTeacher.mockResolvedValueOnce(course);
			authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
			const result: Course = await uc.getCourse(user.id, course.id);
			expect(result).toEqual(course);
		});
		it('should check for permission to edit course', async () => {
			const { user, course } = setup();

			courseRepo.findOneForTeacherOrSubstituteTeacher.mockResolvedValueOnce(course);
			authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
			await uc.getCourse(user.id, course.id);
			expect(authorizationService.checkPermission).toBeCalledWith(
				user,
				course,
				AuthorizationContextBuilder.write([Permission.COURSE_EDIT])
			);
		});
		it('should throw error if user has no permission to edit course', async () => {
			const { user, course } = setup();

			courseRepo.findOneForTeacherOrSubstituteTeacher.mockResolvedValueOnce(course);
			authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
			authorizationService.checkPermission.mockImplementation(() => {
				throw new ForbiddenException();
			});
			await expect(async () => {
				await uc.getCourse(user.id, course.id);
			}).rejects.toThrow(ForbiddenException);
		});
	});
});
