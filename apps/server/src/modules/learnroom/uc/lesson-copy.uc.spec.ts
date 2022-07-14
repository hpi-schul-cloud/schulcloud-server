import { createMock } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Actions, LessonCopyParams, LessonCopyService, PermissionTypes, User } from '@shared/domain';
import { Permission } from '@shared/domain/interface/permission.enum';
import { CopyElementType, CopyStatusEnum } from '@shared/domain/types';
import { CourseRepo, LessonRepo, UserRepo } from '@shared/repo';
import { courseFactory, lessonFactory, setupEntities, taskFactory, userFactory } from '@shared/testing';
import { AuthorizationService } from '@src/modules/authorization';
import { TaskCopyUC } from '@src/modules/task/uc';
import { LessonCopyUC } from './lesson-copy.uc';

describe('lesson copy uc', () => {
	let orm: MikroORM;
	let uc: LessonCopyUC;
	let userRepo: UserRepo;
	let lessonRepo: LessonRepo;
	let courseRepo: CourseRepo;
	let authorisation: AuthorizationService;
	let lessonCopyService: LessonCopyService;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				LessonCopyUC,
				{
					provide: TaskCopyUC,
					useValue: createMock<TaskCopyUC>(),
				},
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: LessonRepo,
					useValue: createMock<LessonRepo>(),
				},
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: LessonCopyService,
					useValue: createMock<LessonCopyService>(),
				},
			],
		}).compile();

		uc = module.get(LessonCopyUC);
		userRepo = module.get(UserRepo);
		lessonRepo = module.get(LessonRepo);
		authorisation = module.get(AuthorizationService);
		courseRepo = module.get(CourseRepo);
		lessonCopyService = module.get(LessonCopyService);
	});

	describe('copy lesson', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const course = courseFactory.buildWithId({ teachers: [user] });
			const lesson = lessonFactory.buildWithId();
			const userSpy = jest
				.spyOn(authorisation, 'getUserWithPermissions')
				.mockImplementation(() => Promise.resolve(user));
			const lessonSpy = jest.spyOn(lessonRepo, 'findById').mockImplementation(() => Promise.resolve(lesson));
			const courseSpy = jest.spyOn(courseRepo, 'findById').mockImplementation(() => Promise.resolve(course));
			const authSpy = jest.spyOn(authorisation, 'hasPermission').mockImplementation(() => true);
			const copy = lessonFactory.buildWithId({ course });
			const status = {
				title: 'lessonCopy',
				type: CopyElementType.LESSON,
				status: CopyStatusEnum.SUCCESS,
				copyEntity: copy,
			};
			const lessonCopySpy = jest
				.spyOn(lessonCopyService, 'copyLesson')
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.mockImplementation((params: LessonCopyParams) => status);
			const lessonPersistSpy = jest.spyOn(lessonRepo, 'save');
			return {
				user,
				course,
				lesson,
				userSpy,
				lessonSpy,
				courseSpy,
				authSpy,
				copy,
				status,
				lessonCopySpy,
				lessonPersistSpy,
			};
		};

		it('should fetch correct user', async () => {
			const { course, user, lesson, userSpy } = setup();
			await uc.copyLesson(user.id, lesson.id, { courseId: course.id });
			expect(userSpy).toBeCalledWith(user.id);
		});

		it('should fetch correct lesson', async () => {
			const { course, user, lesson, lessonSpy } = setup();
			await uc.copyLesson(user.id, lesson.id, { courseId: course.id });
			expect(lessonSpy).toBeCalledWith(lesson.id);
		});

		it('should fetch destination course', async () => {
			const { course, user, lesson, courseSpy } = setup();
			await uc.copyLesson(user.id, lesson.id, { courseId: course.id });
			expect(courseSpy).toBeCalledWith(course.id);
		});

		it('should pass without destination course', async () => {
			const { user, lesson, courseSpy } = setup();
			await uc.copyLesson(user.id, lesson.id, {});
			expect(courseSpy).not.toHaveBeenCalled();
		});

		it('should check authorisation for lesson', async () => {
			const { course, user, lesson, authSpy } = setup();
			await uc.copyLesson(user.id, lesson.id, { courseId: course.id });
			expect(authSpy).toBeCalledWith(user, lesson, {
				action: Actions.read,
				requiredPermissions: [Permission.TOPIC_CREATE],
			});
		});

		it('should check authorisation for destination course', async () => {
			const { course, user, lesson, authSpy } = setup();
			await uc.copyLesson(user.id, lesson.id, { courseId: course.id });
			expect(authSpy).toBeCalledWith(user, course, {
				action: Actions.write,
				requiredPermissions: [],
			});
		});

		it('should pass authorisation check without destination course', async () => {
			const { course, user, lesson, authSpy } = setup();
			await uc.copyLesson(user.id, lesson.id, {});
			expect(authSpy).not.toBeCalledWith(user, course, {
				action: Actions.write,
				requiredPermissions: [],
			});
		});

		it('should call copy service', async () => {
			const { course, user, lesson, lessonCopySpy } = setup();
			await uc.copyLesson(user.id, lesson.id, { courseId: course.id });
			expect(lessonCopySpy).toBeCalledWith({ originalLesson: lesson, destinationCourse: course, user });
		});

		it('should persist copy', async () => {
			const { course, user, lesson, lessonPersistSpy, copy } = setup();
			await uc.copyLesson(user.id, lesson.id, { courseId: course.id });
			expect(lessonPersistSpy).toBeCalledWith(copy);
		});

		it('should return status', async () => {
			const { course, user, lesson, status } = setup();
			const result = await uc.copyLesson(user.id, lesson.id, { courseId: course.id });
			expect(result).toEqual(status);
		});

		describe('when access to lesson is forbidden', () => {
			const setupWithLessonForbidden = () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
				const lesson = lessonFactory.buildWithId();
				jest.spyOn(userRepo, 'findById').mockImplementation(() => Promise.resolve(user));
				jest.spyOn(lessonRepo, 'findById').mockImplementation(() => Promise.resolve(lesson));
				jest.spyOn(authorisation, 'hasPermission').mockImplementation((u: User, e: PermissionTypes) => {
					if (e === lesson) return false;
					return true;
				});
				return { user, course, lesson };
			};

			it('should throw NotFoundException', async () => {
				const { course, user, lesson } = setupWithLessonForbidden();

				try {
					await uc.copyLesson(user.id, lesson.id, { courseId: course.id });
					throw new Error('should have failed');
				} catch (err) {
					expect(err).toBeInstanceOf(ForbiddenException);
				}
			});
		});

		describe('when access to course is forbidden', () => {
			const setupWithCourseForbidden = () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
				const lesson = lessonFactory.buildWithId();
				jest.spyOn(userRepo, 'findById').mockImplementation(() => Promise.resolve(user));
				jest.spyOn(lessonRepo, 'findById').mockImplementation(() => Promise.resolve(lesson));
				jest.spyOn(courseRepo, 'findById').mockImplementation(() => Promise.resolve(course));
				jest.spyOn(authorisation, 'hasPermission').mockImplementation((u: User, e: PermissionTypes) => {
					if (e === course) return false;
					return true;
				});
				return { user, course, lesson };
			};

			it('should throw Forbidden Exception', async () => {
				const { course, user, lesson } = setupWithCourseForbidden();

				try {
					await uc.copyLesson(user.id, lesson.id, { courseId: course.id });
					throw new Error('should have failed');
				} catch (err) {
					expect(err).toBeInstanceOf(ForbiddenException);
				}
			});
		});

		describe('when tasks are linked to the original lesson', () => {
			const setupWithLinkedTasks = () => {
				const user = userFactory.buildWithId();
				const originalCourse = courseFactory.buildWithId({ school: user.school });
				const destinationCourse = courseFactory.buildWithId({ school: user.school });
				const originalLesson = lessonFactory.buildWithId({ course: originalCourse });
				const originalTask = taskFactory.buildWithId({
					description: 'lesson task description',
					course: originalCourse,
					lesson: originalLesson,
				});
				jest.spyOn(userRepo, 'findById').mockImplementation(() => Promise.resolve(user));
				jest.spyOn(lessonRepo, 'findById').mockImplementation(() => Promise.resolve(originalLesson));
				jest.spyOn(courseRepo, 'findById').mockImplementation(() => Promise.resolve(originalCourse));
				jest.spyOn(authorisation, 'hasPermission').mockImplementation(() => true);
				return { user, originalCourse, destinationCourse, originalLesson, originalTask };
			};

			it('xyz', async () => {
				const { originalCourse, user, originalLesson } = setupWithLinkedTasks();

				const result = await uc.copyLesson(user.id, originalLesson.id, { courseId: originalCourse.id });
				expect(result).toBeDefined();
			});
		});
	});
});
