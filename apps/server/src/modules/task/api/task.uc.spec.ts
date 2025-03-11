import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Action, AuthorizationService } from '@modules/authorization';
import { CourseService } from '@modules/course';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { LessonService } from '@modules/lesson';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { lessonFactory } from '@modules/lesson/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PaginationParams } from '@shared/controller/dto';
import { Permission, SortOrder } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { roleFactory } from '@testing/factory/role.factory';
import { TaskService, TaskStatus } from '../domain';
import { Submission, Task, TaskRepo } from '../repo';
import { submissionFactory, taskFactory } from '../testing';
import { TaskUC } from './task.uc';

describe('TaskUC', () => {
	let module: TestingModule;
	let service: TaskUC;
	let taskRepo: DeepMocked<TaskRepo>;
	let courseService: DeepMocked<CourseService>;
	let lessonService: DeepMocked<LessonService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let taskService: DeepMocked<TaskService>;

	const setupUser = (permissions: Permission[]) => {
		const role = roleFactory.build({ permissions });
		const user = userFactory.buildWithId({ roles: [role] });
		return user;
	};

	beforeAll(async () => {
		await setupEntities([User, Task, Submission, CourseEntity, CourseGroupEntity, LessonEntity, Material]);

		module = await Test.createTestingModule({
			imports: [],
			providers: [
				TaskUC,
				{
					provide: TaskRepo,
					useValue: createMock<TaskRepo>(),
				},
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
				{
					provide: LessonService,
					useValue: createMock<LessonService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: TaskService,
					useValue: createMock<TaskService>(),
				},
				{
					provide: TaskService,
					useValue: createMock<TaskService>(),
				},
			],
		}).compile();

		service = module.get(TaskUC);
		taskRepo = module.get(TaskRepo);
		courseService = module.get(CourseService);
		lessonService = module.get(LessonService);
		authorizationService = module.get(AuthorizationService);
		taskService = module.get(TaskService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('[method] findAllFinished', () => {
		describe('when finished tasks is given, and user has read permission to task and is found', () => {
			const setup = () => {
				const permissions = [Permission.TASK_DASHBOARD_VIEW_V3];
				const user = setupUser(permissions);
				const finishedTask = taskFactory.finished(user).build();
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				courseService.findAllByUserId.mockResolvedValueOnce([]);
				lessonService.findByCourseIds.mockResolvedValueOnce([[], 0]);
				lessonService.findByCourseIds.mockResolvedValueOnce([[], 0]);
				authorizationService.hasPermission.mockReturnValueOnce(false);
				taskRepo.findAllFinishedByParentIds.mockResolvedValueOnce([[finishedTask], 1]);

				return { user, finishedTask };
			};

			it('should call auth getUserWithPermissions() with userId', async () => {
				const { user } = setup();

				await service.findAllFinished(user.id);
				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(user.id);
			});

			it('should return task for a user', async () => {
				const { user } = setup();

				const [, total] = await service.findAllFinished(user.id);
				expect(total).toEqual(1);
			});

			it('should call task repo findAllFinishedByParentIds', async () => {
				const { user } = setup();

				await service.findAllFinished(user.id);
				expect(taskRepo.findAllFinishedByParentIds).toHaveBeenCalled();
			});

			it('should call task repo findAllFinishedByParentIds for finished tasks', async () => {
				const { user } = setup();

				await service.findAllFinished(user.id);

				const expectedParams = [
					{
						creatorId: user.id,
						openCourseIds: [],
						finishedCourseIds: [],
						lessonIdsOfOpenCourses: [],
						lessonIdsOfFinishedCourses: [],
					},
					{ pagination: undefined, order: { dueDate: SortOrder.desc } },
				];
				expect(taskRepo.findAllFinishedByParentIds).toHaveBeenCalledWith(...expectedParams);
			});

			it('should return a counted type', async () => {
				const { user } = setup();

				const [data, count] = await service.findAllFinished(user.id);

				expect(typeof count).toBe('number');
				expect(Array.isArray(data)).toBe(true);
			});

			it('should return read status vo for tasks', async () => {
				const { user, finishedTask } = setup();
				const status = finishedTask.createStudentStatusForUser(user);

				const [data] = await service.findAllFinished(user.id);

				expect(data[0].task).toEqual(finishedTask);
				expect(data[0].status).toEqual(status);
				expect(data[0]).toEqual({ task: finishedTask, status });
			});

			it('should pass skip option', async () => {
				const { user } = setup();
				const skip = 5;

				await service.findAllFinished(user.id, { skip });

				const expectedParams = [
					{
						creatorId: user.id,
						openCourseIds: [],
						finishedCourseIds: [],
						lessonIdsOfOpenCourses: [],
						lessonIdsOfFinishedCourses: [],
					},
					{ pagination: { skip }, order: { dueDate: SortOrder.desc } },
				];
				expect(taskRepo.findAllFinishedByParentIds).toHaveBeenCalledWith(...expectedParams);
			});

			it('should pass limit option', async () => {
				const { user } = setup();
				const limit = 5;
				await service.findAllFinished(user.id, { limit });

				const expectedParams = [
					{
						creatorId: user.id,
						openCourseIds: [],
						finishedCourseIds: [],
						lessonIdsOfOpenCourses: [],
						lessonIdsOfFinishedCourses: [],
					},
					{ pagination: { limit }, order: { dueDate: SortOrder.desc } },
				];
				expect(taskRepo.findAllFinishedByParentIds).toHaveBeenCalledWith(...expectedParams);
			});
		});

		describe('When finished task has lesson parent and is found successfully, and user has read permission to task and is found', () => {
			const setup = () => {
				const permissions = [Permission.TASK_DASHBOARD_VIEW_V3];
				const user = setupUser(permissions);
				const task = taskFactory.finished(user).build();
				const lesson = lessonFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				courseService.findAllByUserId.mockResolvedValue([]);
				lessonService.findByCourseIds.mockResolvedValueOnce([[lesson], 1]);
				lessonService.findByCourseIds.mockResolvedValueOnce([[], 0]);
				authorizationService.hasPermission.mockReturnValueOnce(false);
				taskRepo.findAllFinishedByParentIds.mockResolvedValue([[task], 1]);

				return { user, task, lesson };
			};

			it('should used permitted lessons for search finished tasks', async () => {
				const { user, lesson } = setup();

				await service.findAllFinished(user.id);

				const expectedParams = [
					{
						creatorId: user.id,
						openCourseIds: [],
						finishedCourseIds: [],
						lessonIdsOfOpenCourses: [lesson.id],
						lessonIdsOfFinishedCourses: [],
					},
					{ pagination: undefined, order: { dueDate: SortOrder.desc } },
				];
				expect(taskRepo.findAllFinishedByParentIds).toHaveBeenCalledWith(...expectedParams);
			});
		});

		describe('When finished task has course parent and is found successfully, and user has read permission to task and is found', () => {
			const setup = () => {
				const permissions = [Permission.TASK_DASHBOARD_VIEW_V3];
				const user = setupUser(permissions);
				const task = taskFactory.finished(user).build();
				const course = courseEntityFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				courseService.findAllByUserId.mockResolvedValueOnce([course]);
				lessonService.findByCourseIds.mockResolvedValueOnce([[], 0]);
				lessonService.findByCourseIds.mockResolvedValueOnce([[], 0]);
				authorizationService.hasPermission.mockReturnValueOnce(false);
				taskRepo.findAllFinishedByParentIds.mockResolvedValueOnce([[task], 1]);

				return { user, task, course };
			};

			it('should used permitted courses for search finished tasks', async () => {
				const { user, course } = setup();

				await service.findAllFinished(user.id);

				const expectedParams = [
					{
						creatorId: user.id,
						openCourseIds: [course.id],
						finishedCourseIds: [],
						lessonIdsOfOpenCourses: [],
						lessonIdsOfFinishedCourses: [],
					},
					{ pagination: undefined, order: { dueDate: SortOrder.desc } },
				];
				expect(taskRepo.findAllFinishedByParentIds).toHaveBeenCalledWith(...expectedParams);
			});
		});

		describe('when finished task has user parent, and user has write and teacher dashboard permission to task and is found', () => {
			const setup = () => {
				const permissions = [Permission.TASK_DASHBOARD_TEACHER_VIEW_V3];
				const user = setupUser(permissions);

				const task = taskFactory.finished(user).build({ creator: user });

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				courseService.findAllByUserId.mockResolvedValueOnce([]);
				lessonService.findByCourseIds.mockResolvedValueOnce([[], 0]);
				lessonService.findByCourseIds.mockResolvedValueOnce([[], 0]);
				authorizationService.hasPermission.mockReturnValueOnce(true);
				taskRepo.findAllFinishedByParentIds.mockResolvedValueOnce([[task], 1]);

				return { user };
			};

			it('should return finished tasks', async () => {
				const { user } = setup();

				const [, total] = await service.findAllFinished(user.id);

				expect(total).toEqual(1);
			});
		});

		describe('when task has course parent, and user has write and teacher dashboard permission to task and is found', () => {
			const setup = () => {
				const permissions = [Permission.TASK_DASHBOARD_TEACHER_VIEW_V3];
				const user = setupUser(permissions);

				const course = courseEntityFactory.build({ teachers: [user] });
				const task = taskFactory.finished(user).build({ course });

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				courseService.findAllByUserId.mockResolvedValueOnce([course]);
				lessonService.findByCourseIds.mockResolvedValueOnce([[], 0]);
				lessonService.findByCourseIds.mockResolvedValueOnce([[], 0]);
				authorizationService.hasPermission.mockReturnValueOnce(true);
				authorizationService.hasPermission.mockReturnValueOnce(true);
				taskRepo.findAllFinishedByParentIds.mockResolvedValueOnce([[task], 1]);
				const spy = jest.spyOn(task, 'createTeacherStatusForUser');

				return { user, task, spy };
			};

			it('should select the right status', async () => {
				const { user, spy } = setup();

				await service.findAllFinished(user.id);

				expect(spy).toHaveBeenCalled();
				spy.mockRestore();
			});
		});

		describe('when user has no task overview permissions, and user has no task overview permission', () => {
			const setup = () => {
				const permissions = [];
				const user = setupUser(permissions);

				authorizationService.checkOneOfPermissions.mockImplementationOnce(() => {
					throw new UnauthorizedException();
				});

				return { user };
			};

			it('should fail with UnauthorizedException', async () => {
				const { user } = setup();

				await expect(() => service.findAllFinished(user.id)).rejects.toThrow(UnauthorizedException);
			});
		});
	});

	describe('[method] findAll', () => {
		describe('when user has no permissions', () => {
			const setup = () => {
				const permissions = [];
				const user = setupUser(permissions);
				const paginationParams = new PaginationParams();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.hasAllPermissions.mockReturnValueOnce(false);
				authorizationService.hasAllPermissions.mockReturnValueOnce(false);

				return { user, paginationParams };
			};

			it('should call authorizationService.hasAllPermissions with correct permissions and throw', async () => {
				const { user, paginationParams } = setup();

				await expect(service.findAll(user.id, paginationParams)).rejects.toThrowError(UnauthorizedException);

				expect(authorizationService.hasAllPermissions).toHaveBeenNthCalledWith(1, user, [
					Permission.TASK_DASHBOARD_VIEW_V3,
				]);
				expect(authorizationService.hasAllPermissions).toHaveBeenNthCalledWith(2, user, [
					Permission.TASK_DASHBOARD_TEACHER_VIEW_V3,
				]);
			});
		});

		describe('when user is a student', () => {
			const setup = () => {
				const permissions = [Permission.TASK_DASHBOARD_VIEW_V3];
				const user = setupUser(permissions);
				const user2 = setupUser([]);
				const paginationParams = new PaginationParams();
				const course = courseEntityFactory.buildWithId();
				const lesson = lessonFactory.buildWithId({ course, hidden: false });
				const task1 = taskFactory.build({ course });
				const task2 = taskFactory.build({ course });
				const task3 = taskFactory.build({ course });
				task2.submissions.add(submissionFactory.submitted().build({ task: task2, student: user, graded: true }));
				task3.submissions.add(submissionFactory.submitted().build({ task: task3, student: user2, graded: true }));

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.hasAllPermissions.mockReturnValueOnce(true);
				courseService.findAllByUserId.mockResolvedValueOnce([course]);
				authorizationService.hasPermission.mockReturnValueOnce(false);
				lessonService.findByCourseIds.mockResolvedValueOnce([[], 0]);
				lessonService.findByCourseIds.mockResolvedValueOnce([[lesson], 1]);
				taskRepo.findAllByParentIds.mockResolvedValueOnce([[task1, task2, task3], 3]);

				return { user, course, lesson, task1, paginationParams };
			};

			it('should return a counted result', async () => {
				const { user, paginationParams } = setup();

				const [result, count] = await service.findAll(user.id, paginationParams);

				expect(taskRepo.findAllByParentIds).toHaveBeenCalledTimes(1);
				expect(Array.isArray(result)).toBeTruthy();
				expect(count).toEqual(3);
			});

			it('should find current tasks by permitted parent ids ordered by dueDate', async () => {
				const { user, course, lesson, paginationParams } = setup();

				await service.findAll(user.id, paginationParams);

				expect(taskRepo.findAllByParentIds).toHaveBeenCalledTimes(1);
				expect(taskRepo.findAllByParentIds.mock.calls[0][0]).toEqual({
					creatorId: user.id,
					courseIds: [course.id],
					lessonIds: [lesson.id],
				});
				expect(taskRepo.findAllByParentIds.mock.calls[0][1]?.finished).toEqual({ userId: user.id, value: false });
				expect(taskRepo.findAllByParentIds.mock.calls[0][1]?.afterDueDateOrNone).toBeDefined();
				expect(taskRepo.findAllByParentIds.mock.calls[0][2]).toEqual({
					order: { dueDate: 'asc' },
					pagination: { skip: paginationParams.skip, limit: paginationParams.limit },
				});
			});

			it('should find current tasks by permitted parent ids ordered by dueDate', async () => {
				const { user, course, lesson, paginationParams } = setup();

				await service.findAll(user.id, paginationParams);

				expect(taskRepo.findAllByParentIds).toHaveBeenCalledTimes(1);
				expect(taskRepo.findAllByParentIds.mock.calls[0][0]).toEqual({
					creatorId: user.id,
					courseIds: [course.id],
					lessonIds: [lesson.id],
				});
				expect(taskRepo.findAllByParentIds.mock.calls[0][1]?.finished).toEqual({ userId: user.id, value: false });
				expect(taskRepo.findAllByParentIds.mock.calls[0][1]?.afterDueDateOrNone).toBeDefined();
				expect(taskRepo.findAllByParentIds.mock.calls[0][2]).toEqual({
					order: { dueDate: 'asc' },
					pagination: { skip: paginationParams.skip, limit: paginationParams.limit },
				});
			});

			it('should return well formed task with course and status', async () => {
				const { user, task1, paginationParams } = setup();

				const [result] = await service.findAll(user.id, paginationParams);

				expect(result[0]).toEqual({
					task: task1,
					status: {
						submitted: 0,
						maxSubmissions: 1,
						graded: 0,
						isDraft: false,
						isFinished: false,
						isSubstitutionTeacher: false,
					},
				});
				expect(result[0].task.course).toBeDefined();
			});

			it('should find a list of tasks', async () => {
				const { user, paginationParams } = setup();

				const [result, count] = await service.findAll(user.id, paginationParams);

				expect(count).toEqual(3);
				expect(result.length).toEqual(3);
			});

			it('should compute submitted and graded status for task', async () => {
				const { user, paginationParams } = setup();

				const [result] = await service.findAll(user.id, paginationParams);

				expect(result.length).toEqual(3);
				expect(result[1].status).toEqual({
					graded: 1,
					submitted: 1,
					maxSubmissions: 1,
					isDraft: false,
					isFinished: false,
					isSubstitutionTeacher: false,
				});
			});
		});

		describe('when user a substitution teacher in a course with lesson and a single task', () => {
			const setup = () => {
				const permissions = [Permission.TASK_DASHBOARD_TEACHER_VIEW_V3];
				const user = setupUser(permissions);
				const paginationParams = new PaginationParams();
				const course = courseEntityFactory.buildWithId({ substitutionTeachers: [user] });
				const lesson = lessonFactory.buildWithId({ course, hidden: false });
				const task = taskFactory.build({ course });

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.hasAllPermissions.mockReturnValueOnce(false);
				authorizationService.hasAllPermissions.mockReturnValueOnce(true);
				courseService.findAllForTeacherOrSubstituteTeacher.mockResolvedValueOnce([course]);
				authorizationService.hasPermission.mockReturnValueOnce(true);
				lessonService.findByCourseIds.mockResolvedValueOnce([[lesson], 1]);
				lessonService.findByCourseIds.mockResolvedValueOnce([[], 0]);
				taskRepo.findAllByParentIds.mockResolvedValueOnce([[task], 1]);

				return { user, paginationParams };
			};

			it('should mark substitution teacher in status', async () => {
				const { user, paginationParams } = setup();

				const [result] = await service.findAll(user.id, paginationParams);

				expect(result[0].status.isSubstitutionTeacher).toBe(true);
			});
		});

		describe('when user is a teacher with a course and hidden lesson and 3 tasks', () => {
			const setup = () => {
				const permissions = [Permission.TASK_DASHBOARD_TEACHER_VIEW_V3];
				const user = setupUser(permissions);
				const paginationParams = new PaginationParams();
				const course = courseEntityFactory.buildWithId();
				const lesson = lessonFactory.buildWithId({ course, hidden: false });
				const task1 = taskFactory.build({ course });
				const task2 = taskFactory.build({ course });
				const task3 = taskFactory.build({ course });
				task2.submissions.add(
					submissionFactory.submitted().build({ task: task2, student: user, teamMembers: [user], graded: true })
				);

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.hasAllPermissions.mockReturnValueOnce(false);
				authorizationService.hasAllPermissions.mockReturnValueOnce(true);
				courseService.findAllForTeacherOrSubstituteTeacher.mockResolvedValueOnce([course]);
				authorizationService.hasPermission.mockReturnValueOnce(true);
				lessonService.findByCourseIds.mockResolvedValueOnce([[lesson], 1]);
				lessonService.findByCourseIds.mockResolvedValueOnce([[], 0]);
				taskRepo.findAllByParentIds.mockResolvedValueOnce([[task1, task2, task3], 3]);

				return { user, course, lesson, task1, paginationParams };
			};

			it('should return a counted result', async () => {
				const { user, paginationParams } = setup();

				const [result, count] = await service.findAll(user.id, paginationParams);

				expect(Array.isArray(result)).toBeTruthy();
				expect(count).toEqual(3);
			});

			it('should find all tasks by permitted parent ids ordered by newest first', async () => {
				const { user, course, lesson, paginationParams } = setup();

				await service.findAll(user.id, paginationParams);

				const notFinished = { userId: user.id, value: false };
				const expectedParams = [
					{ creatorId: user.id, courseIds: [course.id], lessonIds: [lesson.id] },
					{ finished: notFinished, availableOn: expect.any(Date) },
					{ order: { dueDate: 'desc' }, pagination: { skip: paginationParams.skip, limit: paginationParams.limit } },
				];

				expect(taskRepo.findAllByParentIds).toHaveBeenCalledWith(...expectedParams);
			});

			it('should return well formed task with course and status', async () => {
				const { user, course, task1, paginationParams } = setup();

				const [result] = await service.findAll(user.id, paginationParams);

				expect(result[0]).toEqual({
					task: task1,
					status: {
						submitted: 0,
						maxSubmissions: course.getStudentIds().length,
						graded: 0,
						isDraft: false,
						isFinished: false,
						isSubstitutionTeacher: false,
					},
				});
				expect(result[0].task.course).toBeDefined();
			});

			it('should find a list of tasks', async () => {
				const { user, paginationParams } = setup();

				const [result, count] = await service.findAll(user.id, paginationParams);

				expect(count).toEqual(3);
				expect(result.length).toEqual(3);
			});

			it('should compute submitted, graded and maxSubmissions status for task', async () => {
				const { user, paginationParams, course } = setup();

				const [result] = await service.findAll(user.id, paginationParams);

				expect(result[1].status).toEqual({
					graded: 1,
					submitted: 1,
					maxSubmissions: course.getStudentIds().length,
					isDraft: false,
					isFinished: false,
					isSubstitutionTeacher: false,
				});
			});
		});
	});

	describe('[method] changeFinishedForUser', () => {
		const mockStatus: TaskStatus = {
			submitted: 1,
			graded: 1,
			maxSubmissions: 1,
			isDraft: false,
			isSubstitutionTeacher: false,
			isFinished: false,
		};

		describe('when task has 1 creator and 1 user without permission', () => {
			const setup = () => {
				const creator = userFactory.buildWithId();
				const userWithoutPermission = userFactory.buildWithId();
				const task = taskFactory.buildWithId({ creator });

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(creator);
				taskRepo.findById.mockResolvedValueOnce(task);
				authorizationService.checkPermission.mockImplementationOnce(() => {
					throw new ForbiddenException();
				});

				return { creator, task, userWithoutPermission };
			};

			it('should throw ForbiddenException when not permitted', async () => {
				const { userWithoutPermission, task } = setup();

				await expect(async () => {
					await service.changeFinishedForUser(userWithoutPermission.id, task.id, true);
				}).rejects.toThrow(ForbiddenException);
			});
		});

		describe('when user is creator without any dashboard permission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId({ creator: user });

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				taskRepo.findById.mockResolvedValueOnce(task);

				const finishForUserMock = jest.spyOn(task, 'finishForUser');
				const restoreForUserMock = jest.spyOn(task, 'restoreForUser');

				authorizationService.hasOneOfPermissions.mockReturnValueOnce(false);

				const restoreMocks = () => {
					finishForUserMock.mockRestore();
					restoreForUserMock.mockRestore();
				};

				return { user, task, restoreMocks };
			};

			it('should check for permission to finish the task', async () => {
				const { user, task, restoreMocks } = setup();

				await service.changeFinishedForUser(user.id, task.id, true);

				expect(authorizationService.checkPermission).toBeCalledWith(user, task, {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
					action: Action.read,
					requiredPermissions: [],
				});

				restoreMocks();
			});

			it('should finish the task for the user', async () => {
				const { user, task, restoreMocks } = setup();

				await service.changeFinishedForUser(user.id, task.id, true);

				expect(task.finishForUser).toBeCalled();

				restoreMocks();
			});

			it('should restore the task for the user', async () => {
				const { user, task, restoreMocks } = setup();

				await service.changeFinishedForUser(user.id, task.id, false);

				expect(task.restoreForUser).toBeCalled();

				restoreMocks();
			});

			it('should save the task', async () => {
				const { user, task, restoreMocks } = setup();

				await service.changeFinishedForUser(user.id, task.id, true);

				expect(taskRepo.save).toBeCalledWith(task);

				restoreMocks();
			});

			it('should return the task and its status', async () => {
				const { user, task, restoreMocks } = setup();

				const result = await service.changeFinishedForUser(user.id, task.id, true);

				expect(result.task).toEqual(task);
				expect(result.status).toBeDefined();

				restoreMocks();
			});
		});

		describe('when user is creator with teacherDashboard permission', () => {
			const setup = () => {
				const permissions = [Permission.TASK_DASHBOARD_TEACHER_VIEW_V3];
				const user = setupUser(permissions);
				const task = taskFactory.buildWithId({ creator: user });

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				taskRepo.findById.mockResolvedValueOnce(task);
				const finishForUserMock = jest.spyOn(task, 'finishForUser');
				const restoreForUserMock = jest.spyOn(task, 'restoreForUser');
				authorizationService.hasOneOfPermissions.mockReturnValueOnce(true);
				const createTeacherStatusForUserMock = jest
					.spyOn(task, 'createTeacherStatusForUser')
					.mockReturnValueOnce(mockStatus);

				const restoreMocks = () => {
					finishForUserMock.mockRestore();
					restoreForUserMock.mockRestore();
					createTeacherStatusForUserMock.mockRestore();
				};

				return { user, task, restoreMocks };
			};

			it('should return task and teacher status', async () => {
				const { user, task, restoreMocks } = setup();

				const result = await service.changeFinishedForUser(user.id, task.id, true);

				expect(task.createTeacherStatusForUser).toBeCalled();
				expect(result.task).toEqual(task);
				expect(result.status).toEqual(mockStatus);

				restoreMocks();
			});
		});

		describe('when user is creator with studentDashboard permission', () => {
			const setup = () => {
				const permissions = [Permission.TASK_DASHBOARD_VIEW_V3];
				const user = setupUser(permissions);
				const task = taskFactory.buildWithId({ creator: user });

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				taskRepo.findById.mockResolvedValueOnce(task);
				const finishForUserMock = jest.spyOn(task, 'finishForUser');
				const restoreForUserMock = jest.spyOn(task, 'restoreForUser');
				authorizationService.hasOneOfPermissions.mockReturnValueOnce(false);
				const createStudentStatusForUserMock = jest
					.spyOn(task, 'createStudentStatusForUser')
					.mockReturnValueOnce(mockStatus);

				const restoreMocks = () => {
					finishForUserMock.mockRestore();
					restoreForUserMock.mockRestore();
					createStudentStatusForUserMock.mockRestore();
				};

				return { user, task, restoreMocks };
			};

			it('should return task and student status', async () => {
				const { user, task, restoreMocks } = setup();

				const result = await service.changeFinishedForUser(user.id, task.id, true);

				expect(task.createStudentStatusForUser).toBeCalled();
				expect(result.task).toEqual(task);
				expect(result.status).toEqual(mockStatus);

				restoreMocks();
			});
		});
	});

	describe('[method] revertPublished', () => {
		describe('when user is creator without write permission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId({ creator: user });

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				taskRepo.findById.mockResolvedValueOnce(task);
				authorizationService.checkPermission.mockImplementationOnce(() => {
					throw new ForbiddenException();
				});

				return { user, task };
			};

			it('should throw ForbiddenException when not permitted', async () => {
				const { user, task } = setup();

				await expect(async () => {
					await service.revertPublished(user.id, task.id);
				}).rejects.toThrow(ForbiddenException);

				expect(authorizationService.checkPermission).toBeCalledWith(user, task, {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
					action: Action.write,
					requiredPermissions: [],
				});
			});
		});

		describe('when user is creator without write permission and mocked authZ to throw 403', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId({ creator: user });

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				taskRepo.findById.mockResolvedValueOnce(task);
				authorizationService.checkPermission.mockImplementationOnce(() => {
					throw new ForbiddenException();
				});

				return { user, task };
			};

			it('should throw ForbiddenException when not permitted', async () => {
				const { user, task } = setup();

				await expect(async () => {
					await service.revertPublished(user.id, task.id);
				}).rejects.toThrow(ForbiddenException);

				expect(authorizationService.checkPermission).toBeCalledWith(user, task, {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
					action: Action.write,
					requiredPermissions: [],
				});
			});
		});

		describe('when user is creator with write permission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId({ creator: user });

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				taskRepo.findById.mockResolvedValueOnce(task);
				const unpublishMock = jest.spyOn(task, 'unpublish');
				const createTeacherStatusForUserMock = jest.spyOn(task, 'createTeacherStatusForUser');

				const restoreMocks = () => {
					unpublishMock.mockRestore();
					createTeacherStatusForUserMock.mockRestore();
				};

				return { user, task, restoreMocks };
			};

			it('should call unpublish method in task entity', async () => {
				const { user, task, restoreMocks } = setup();

				await service.revertPublished(user.id, task.id);

				expect(task.unpublish).toBeCalled();

				restoreMocks();
			});

			it('should save the task', async () => {
				const { user, task, restoreMocks } = setup();

				await service.revertPublished(user.id, task.id);

				expect(taskRepo.save).toBeCalledWith(task);

				restoreMocks();
			});

			it('should create teacher status', async () => {
				const { user, task, restoreMocks } = setup();

				await service.revertPublished(user.id, task.id);

				expect(task.createTeacherStatusForUser).toBeCalled();

				restoreMocks();
			});

			it('should return the task and its status', async () => {
				const { user, task, restoreMocks } = setup();

				const result = await service.revertPublished(user.id, task.id);

				expect(result.task).toEqual(task);
				expect(result.status).toBeDefined();

				restoreMocks();
			});
		});
	});

	describe('[method] delete', () => {
		describe('when user has no permission to task', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				taskRepo.findById.mockResolvedValueOnce(task);
				authorizationService.checkPermission.mockImplementationOnce(() => {
					throw new ForbiddenException();
				});

				return { user, task };
			};

			it('should throw ForbiddenException', async () => {
				const { user, task } = setup();

				await expect(async () => {
					await service.delete(user.id, task.id);
				}).rejects.toThrow(new ForbiddenException());
			});
		});

		describe('when taskservice delete rejects', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const error = new Error();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				taskRepo.findById.mockResolvedValueOnce(task);
				taskService.delete.mockRejectedValueOnce(error);

				return { user, task, error };
			};

			it('should pass error', async () => {
				const { user, task, error } = setup();

				await expect(() => service.delete(user.id, task.id)).rejects.toThrow(error);
			});
		});

		describe('when taskservice deletes successfully', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				taskRepo.findById.mockResolvedValueOnce(task);

				return { user, task };
			};

			it('should call authorizationService.hasPermission() with User Task Aktion.write', async () => {
				const { user, task } = setup();

				await service.delete(user.id, task.id);

				expect(authorizationService.checkPermission).toBeCalledWith(user, task, {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
					action: Action.write,
					requiredPermissions: [],
				});
			});

			it('should call taskService.delete', async () => {
				const { user, task } = setup();

				await service.delete(user.id, task.id);

				expect(taskService.delete).toBeCalledWith(task);
			});

			it('should return true', async () => {
				const { user, task } = setup();

				const result = await service.delete(user.id, task.id);

				expect(result).toBe(true);
			});
		});
	});
});
