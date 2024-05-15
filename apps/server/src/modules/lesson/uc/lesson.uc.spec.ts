import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { courseFactory, lessonFactory, setupEntities, userFactory } from '@shared/testing/factory';
import { CourseService } from '@modules/learnroom/service';
import { LessonService } from '../service';
import { LessonUC } from './lesson.uc';

describe('LessonUC', () => {
	let lessonUC: LessonUC;
	let module: TestingModule;

	let lessonService: DeepMocked<LessonService>;
	let courseService: DeepMocked<CourseService>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				LessonUC,
				{
					provide: LessonService,
					useValue: createMock<LessonService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
			],
		}).compile();
		lessonUC = module.get(LessonUC);

		lessonService = module.get(LessonService);
		courseService = module.get(CourseService);
		authorizationService = module.get(AuthorizationService);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(lessonUC).toBeDefined();
	});

	it('delete', async () => {
		const user = userFactory.buildWithId();
		const lesson = lessonFactory.buildWithId();

		authorizationService.getUserWithPermissions.mockResolvedValue(user);
		lessonService.findById.mockResolvedValue(lesson);

		const result = await lessonUC.delete(user.id, lesson.id);

		expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(user.id);
		expect(lessonService.findById).toHaveBeenCalledWith(lesson.id);

		expect(authorizationService.checkPermission).toHaveBeenCalledWith(
			expect.objectContaining({ ...user }),
			expect.objectContaining({ ...lesson }),
			AuthorizationContextBuilder.write([Permission.TOPIC_VIEW])
		);
		expect(lessonService.deleteLesson).toHaveBeenCalledWith(expect.objectContaining({ ...lesson }));

		expect(result).toBe(true);
	});

	describe('getLesons', () => {
		describe('when user is a valid teacher', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				const course = courseFactory.buildWithId();
				courseService.findOneForUser.mockResolvedValueOnce(course);

				const lesson = lessonFactory.buildWithId({ course });
				const hiddenLesson = lessonFactory.buildWithId({ course, hidden: true });
				lessonService.findByCourseIds.mockResolvedValueOnce([[lesson, hiddenLesson], 2]);
				authorizationService.hasPermission.mockReturnValue(true);

				return { user, course, lesson, hiddenLesson };
			};
			it('should get user with permissions from authorizationService', async () => {
				const { user } = setup();
				await lessonUC.getLessons(user.id, 'courseId');
				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(user.id);
			});
			it('should get course from courseService', async () => {
				const { user, course } = setup();
				await lessonUC.getLessons(user.id, course.id);
				expect(courseService.findOneForUser).toHaveBeenCalledWith(course.id, user.id);
			});
			it('should check user course permission', async () => {
				const { user, course } = setup();
				await lessonUC.getLessons(user.id, course.id);
				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					expect.objectContaining({ ...user }),
					expect.objectContaining({ ...course }),
					AuthorizationContextBuilder.read([Permission.COURSE_VIEW])
				);
			});
			it('should call lessonService', async () => {
				const { user, course } = setup();
				await lessonUC.getLessons(user.id, course.id);
				expect(lessonService.findByCourseIds).toHaveBeenCalledWith([course.id]);
			});
			it('should check permission', async () => {
				const { user, course, lesson, hiddenLesson } = setup();
				await lessonUC.getLessons(user.id, course.id);
				expect(authorizationService.hasPermission.mock.calls).toEqual([
					[user, lesson, AuthorizationContextBuilder.read([Permission.TOPIC_VIEW])],
					[user, hiddenLesson, AuthorizationContextBuilder.read([Permission.TOPIC_VIEW])],
				]);
			});
			it('should return all lessons', async () => {
				const { user, course, lesson, hiddenLesson } = setup();
				const result = await lessonUC.getLessons(user.id, course.id);
				expect(result).toEqual([lesson, hiddenLesson]);
			});
		});
		describe('when user is a valid student', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				const course = courseFactory.buildWithId();
				courseService.findOneForUser.mockResolvedValueOnce(course);

				const lesson = lessonFactory.buildWithId({ course });
				const hiddenLesson = lessonFactory.buildWithId({ course, hidden: true });
				lessonService.findByCourseIds.mockResolvedValueOnce([[lesson, hiddenLesson], 2]);

				authorizationService.hasPermission.mockReturnValueOnce(true).mockReturnValueOnce(false);

				return { user, course, lesson, hiddenLesson };
			};
			it('should filter out hidden lessons', async () => {
				const { user, course, lesson } = setup();
				const result = await lessonUC.getLessons(user.id, course.id);
				expect(result).toEqual([lesson]);
			});
		});
	});

	describe('getLesson', () => {
		describe('when user is a valid teacher', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				const lesson = lessonFactory.buildWithId();
				lessonService.findById.mockResolvedValueOnce(lesson);

				authorizationService.hasPermission.mockReturnValueOnce(true);

				return { user, lesson };
			};
			it('should get user with permissions from authorizationService', async () => {
				const { user } = setup();
				await lessonUC.getLesson(user.id, 'lessonId');
				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(user.id);
			});
			it('should get lesson from lessonService', async () => {
				const { user, lesson } = setup();
				await lessonUC.getLesson(user.id, lesson.id);
				expect(lessonService.findById).toHaveBeenCalledWith(lesson.id);
			});
			it('should return check permission', async () => {
				const { user, lesson } = setup();
				await lessonUC.getLesson(user.id, lesson.id);
				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					expect.objectContaining({ ...user }),
					expect.objectContaining({ ...lesson }),
					AuthorizationContextBuilder.read([Permission.TOPIC_VIEW])
				);
			});
			it('should return lesson', async () => {
				const { user, lesson } = setup();
				const result = await lessonUC.getLesson(user.id, lesson.id);
				expect(result).toEqual(lesson);
			});
		});
	});
});
