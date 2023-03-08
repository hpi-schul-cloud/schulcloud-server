import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PaginationParams } from '@shared/controller';
import { Actions, Course, ITaskStatus, Lesson, Permission, SortOrder, Task, User } from '@shared/domain';
import { CourseRepo, LessonRepo, TaskRepo, UserRepo } from '@shared/repo';
import {
	courseFactory,
	lessonFactory,
	roleFactory,
	setupEntities,
	submissionFactory,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { AuthorizationService } from '@src/modules/authorization';
import { TaskService } from '../service';
import { TaskUC } from './task.uc';

describe('TaskUC', () => {
	let module: TestingModule;
	let service: TaskUC;
	let taskRepo: DeepMocked<TaskRepo>;
	let userRepo: DeepMocked<UserRepo>;
	let courseRepo: DeepMocked<CourseRepo>;
	let lessonRepo: DeepMocked<LessonRepo>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let taskService: DeepMocked<TaskService>;
	let orm: MikroORM;

	const setupUser = (permissions: Permission[]) => {
		const role = roleFactory.build({ permissions });
		const user = userFactory.buildWithId({ roles: [role] });
		return user;
	};

	beforeAll(async () => {
		orm = await setupEntities();

		module = await Test.createTestingModule({
			imports: [],
			providers: [
				TaskUC,
				{
					provide: TaskRepo,
					useValue: createMock<TaskRepo>(),
				},
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
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
		userRepo = module.get(UserRepo);
		courseRepo = module.get(CourseRepo);
		lessonRepo = module.get(LessonRepo);
		authorizationService = module.get(AuthorizationService);
		taskService = module.get(TaskService);
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const setUserRepoMock = {
		findById: (user: User) => {
			const spy = userRepo.findById.mockResolvedValue(user);
			return spy;
		},
	};

	const setAuthorizationServiceMock = {
		getUserWithPermissions: (user: User) => {
			const spy = authorizationService.getUserWithPermissions.mockResolvedValue(user);
			return spy;
		},
	};

	const setTaskRepoMock = {
		findAllByParentIds: (tasks: Task[] = []) => {
			const spy = taskRepo.findAllByParentIds.mockResolvedValue([tasks, tasks.length]);
			return spy;
		},
		findAllFinishedByParentIds: (tasks: Task[] = []) => {
			const spy = taskRepo.findAllFinishedByParentIds.mockResolvedValue([tasks, tasks.length]);
			return spy;
		},
	};

	const setCourseRepoMock = {
		findAllForTeacher: (courses: Course[] = []) => {
			const spy = courseRepo.findAllForTeacher.mockResolvedValue([courses, courses.length]);
			return spy;
		},
		findAllForTeacherOrSubstituteTeacher: (courses: Course[] = []) => {
			const spy = courseRepo.findAllForTeacherOrSubstituteTeacher.mockResolvedValue([courses, courses.length]);
			return spy;
		},
		findAllByUserId: (courses: Course[] = []) => {
			const spy = courseRepo.findAllByUserId.mockResolvedValue([courses, courses.length]);
			return spy;
		},
	};
	const setLessonRepoMock = {
		findAllByCourseIds: (lessons: Lesson[] = []) => {
			const spy = lessonRepo.findAllByCourseIds.mockResolvedValue([lessons, lessons.length]);
			return spy;
		},
	};

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('findAllFinished', () => {
		describe('when user has read permission', () => {
			describe('When task has user parent and is found successfully', () => {
				const setup = () => {
					const permissions = [Permission.TASK_DASHBOARD_VIEW_V3];
					const user = setupUser(permissions);
					const task = taskFactory.finished(user).build();

					setAuthorizationServiceMock.getUserWithPermissions(user);
					setCourseRepoMock.findAllByUserId([]);
					setLessonRepoMock.findAllByCourseIds([]);
					authorizationService.hasPermission.mockReturnValueOnce(false);
					const findAllFinishedByParentIdsMock = setTaskRepoMock.findAllFinishedByParentIds([task]);

					return { user, findAllFinishedByParentIdsMock, task };
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
					const { user, findAllFinishedByParentIdsMock } = setup();

					await service.findAllFinished(user.id);

					expect(findAllFinishedByParentIdsMock).toHaveBeenCalled();
				});

				it('should call task repo findAllFinishedByParentIds for finished tasks', async () => {
					const { user, findAllFinishedByParentIdsMock } = setup();

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
					expect(findAllFinishedByParentIdsMock).toHaveBeenCalledWith(...expectedParams);
				});

				it('should return a counted type', async () => {
					const { user } = setup();

					const [data, count] = await service.findAllFinished(user.id);

					expect(typeof count).toBe('number');
					expect(Array.isArray(data)).toBe(true);
				});

				it('should return read status vo for tasks', async () => {
					const { user, task } = setup();
					const status = task.createStudentStatusForUser(user);

					const [data] = await service.findAllFinished(user.id);

					expect(data[0].task).toEqual(task);
					expect(data[0].status).toEqual(status);
					expect(data[0]).toEqual({ task, status });
				});

				it('should pass skip option', async () => {
					const { user, findAllFinishedByParentIdsMock } = setup();
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
					expect(findAllFinishedByParentIdsMock).toHaveBeenCalledWith(...expectedParams);
				});

				it('should pass limit option', async () => {
					const { user, findAllFinishedByParentIdsMock } = setup();
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
					expect(findAllFinishedByParentIdsMock).toHaveBeenCalledWith(...expectedParams);
				});
			});

			describe('When task has lesson parent and is found successfully', () => {
				const setup = () => {
					const permissions = [Permission.TASK_DASHBOARD_VIEW_V3];
					const user = setupUser(permissions);
					const task = taskFactory.finished(user).build();
					const lesson = lessonFactory.buildWithId();

					setAuthorizationServiceMock.getUserWithPermissions(user);
					setCourseRepoMock.findAllByUserId([]);
					lessonRepo.findAllByCourseIds.mockResolvedValueOnce([[lesson], 1]);
					lessonRepo.findAllByCourseIds.mockResolvedValueOnce([[], 0]);
					authorizationService.hasPermission.mockReturnValueOnce(false);
					const findAllFinishedByParentIdsMock = setTaskRepoMock.findAllFinishedByParentIds([task]);

					return { user, findAllFinishedByParentIdsMock, task, lesson };
				};

				it('should used permitted lessons for search finished tasks', async () => {
					const { user, findAllFinishedByParentIdsMock, lesson } = setup();

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
					expect(findAllFinishedByParentIdsMock).toHaveBeenCalledWith(...expectedParams);
				});
			});

			describe('When task has course parent and is found successfully', () => {
				const setup = () => {
					const permissions = [Permission.TASK_DASHBOARD_VIEW_V3];
					const user = setupUser(permissions);
					const task = taskFactory.finished(user).build();
					const course = courseFactory.buildWithId();

					setAuthorizationServiceMock.getUserWithPermissions(user);
					setCourseRepoMock.findAllByUserId([course]);
					setLessonRepoMock.findAllByCourseIds([]);
					authorizationService.hasPermission.mockReturnValueOnce(false);
					const findAllFinishedByParentIdsMock = setTaskRepoMock.findAllFinishedByParentIds([task]);

					return { user, findAllFinishedByParentIdsMock, task, course };
				};

				it('should used permitted courses for search finished tasks', async () => {
					const { user, course } = setup();
					const spy = setTaskRepoMock.findAllFinishedByParentIds();

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
					expect(spy).toHaveBeenCalledWith(...expectedParams);
				});
			});
		});

		describe('when user has write and teacher dashboard permission', () => {
			describe('when task has user parent', () => {
				const setup = () => {
					const permissions = [Permission.TASK_DASHBOARD_TEACHER_VIEW_V3];
					const user = setupUser(permissions);

					const task = taskFactory.finished(user).build({ creator: user });

					setAuthorizationServiceMock.getUserWithPermissions(user);
					setCourseRepoMock.findAllByUserId([]);
					setLessonRepoMock.findAllByCourseIds([]);
					authorizationService.hasPermission.mockReturnValue(true);
					setTaskRepoMock.findAllFinishedByParentIds([task]);

					return { user };
				};

				it('should return finished tasks', async () => {
					const { user } = setup();

					const [, total] = await service.findAllFinished(user.id);

					expect(total).toEqual(1);
				});
			});

			describe('when task has course parent', () => {
				const setup = () => {
					const permissions = [Permission.TASK_DASHBOARD_TEACHER_VIEW_V3];
					const user = setupUser(permissions);

					const course = courseFactory.build({ teachers: [user] });
					const task = taskFactory.finished(user).build({ course });

					setAuthorizationServiceMock.getUserWithPermissions(user);
					setCourseRepoMock.findAllByUserId([course]);
					setLessonRepoMock.findAllByCourseIds([]);
					authorizationService.hasPermission.mockReturnValue(true);
					setTaskRepoMock.findAllFinishedByParentIds([task]);

					return { user, task };
				};

				it('should select the right status', async () => {
					const { user, task } = setup();

					const spy = jest.spyOn(task, 'createTeacherStatusForUser');

					await service.findAllFinished(user.id);

					expect(spy).toHaveBeenCalled();
					spy.mockRestore();
				});
			});
		});

		describe('when user has no task overview permissions', () => {
			const setup = () => {
				const permissions = [];
				const user = setupUser(permissions);

				authorizationService.checkOneOfPermissions.mockImplementation(() => {
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

	describe('findAll', () => {
		describe('without permissions', () => {
			const setup = () => {
				const permissions = [];
				const user = setupUser(permissions);
				const paginationParams = new PaginationParams();

				setAuthorizationServiceMock.getUserWithPermissions(user);
				authorizationService.hasAllPermissions.mockReturnValue(false);

				return { user, paginationParams };
			};

			it('should call authorizationService.hasAllPermissions with correct permissions and throw', async () => {
				const { user, paginationParams } = setup();

				await expect(service.findAll(user.id, paginationParams)).rejects.toThrow();

				expect(authorizationService.hasAllPermissions).toHaveBeenNthCalledWith(1, user, [
					Permission.TASK_DASHBOARD_VIEW_V3,
				]);
				expect(authorizationService.hasAllPermissions).toHaveBeenNthCalledWith(2, user, [
					Permission.TASK_DASHBOARD_TEACHER_VIEW_V3,
				]);
			});
		});

		describe('as a student', () => {
			const setup = () => {
				const permissions = [Permission.TASK_DASHBOARD_VIEW_V3];
				const user = setupUser(permissions);
				const user2 = setupUser([]);
				const paginationParams = new PaginationParams();
				const course = courseFactory.buildWithId();
				const lesson = lessonFactory.buildWithId({ course, hidden: false });
				const task1 = taskFactory.build({ course });
				const task2 = taskFactory.build({ course });
				const task3 = taskFactory.build({ course });
				task2.submissions.add(submissionFactory.submitted().build({ task: task2, student: user, graded: true }));
				task3.submissions.add(submissionFactory.submitted().build({ task: task3, student: user2, graded: true }));

				setAuthorizationServiceMock.getUserWithPermissions(user);
				authorizationService.hasAllPermissions.mockReturnValue(true);
				setCourseRepoMock.findAllByUserId([course]);
				authorizationService.hasPermission.mockReturnValueOnce(false);
				lessonRepo.findAllByCourseIds.mockResolvedValueOnce([[], 0]);
				lessonRepo.findAllByCourseIds.mockResolvedValueOnce([[lesson], 1]);
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

		describe('as a substitution teacher', () => {
			const setup = () => {
				const permissions = [Permission.TASK_DASHBOARD_TEACHER_VIEW_V3];
				const user = setupUser(permissions);
				const paginationParams = new PaginationParams();
				const course = courseFactory.buildWithId({ substitutionTeachers: [user] });
				const lesson = lessonFactory.buildWithId({ course, hidden: false });
				const task = taskFactory.build({ course });

				setAuthorizationServiceMock.getUserWithPermissions(user);
				authorizationService.hasAllPermissions.mockReturnValueOnce(false);
				authorizationService.hasAllPermissions.mockReturnValueOnce(true);
				setCourseRepoMock.findAllForTeacherOrSubstituteTeacher([course]);
				authorizationService.hasPermission.mockReturnValueOnce(true);
				lessonRepo.findAllByCourseIds.mockResolvedValueOnce([[lesson], 1]);
				lessonRepo.findAllByCourseIds.mockResolvedValueOnce([[], 0]);
				taskRepo.findAllByParentIds.mockResolvedValueOnce([[task], 1]);

				return { user, paginationParams };
			};

			it('should mark substitution teacher in status', async () => {
				const { user, paginationParams } = setup();

				const [result] = await service.findAll(user.id, paginationParams);

				expect(result[0].status.isSubstitutionTeacher).toBe(true);
			});
		});

		describe('as a teacher', () => {
			const setup = () => {
				const permissions = [Permission.TASK_DASHBOARD_TEACHER_VIEW_V3];
				const user = setupUser(permissions);
				const paginationParams = new PaginationParams();
				const course = courseFactory.buildWithId();
				const lesson = lessonFactory.buildWithId({ course, hidden: false });
				const task1 = taskFactory.build({ course });
				const task2 = taskFactory.build({ course });
				const task3 = taskFactory.build({ course });
				task2.submissions.add(
					submissionFactory.submitted().build({ task: task2, student: user, teamMembers: [user], graded: true })
				);

				setAuthorizationServiceMock.getUserWithPermissions(user);
				authorizationService.hasAllPermissions.mockReturnValueOnce(false);
				authorizationService.hasAllPermissions.mockReturnValueOnce(true);
				setCourseRepoMock.findAllForTeacherOrSubstituteTeacher([course]);
				authorizationService.hasPermission.mockReturnValueOnce(true);
				lessonRepo.findAllByCourseIds.mockResolvedValueOnce([[lesson], 1]);
				lessonRepo.findAllByCourseIds.mockResolvedValueOnce([[], 0]);
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

	describe('changeFinishedForUser', () => {
		const mockStatus: ITaskStatus = {
			submitted: 1,
			graded: 1,
			maxSubmissions: 1,
			isDraft: false,
			isSubstitutionTeacher: false,
			isFinished: false,
		};

		describe('without permission for task', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const user2 = userFactory.buildWithId();
				const task = taskFactory.buildWithId({ creator: user });

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				taskRepo.findById.mockResolvedValue(task);
				authorizationService.checkPermission.mockImplementation(() => {
					throw new ForbiddenException();
				});

				return { user2, task };
			};

			it('should throw ForbiddenException when not permitted', async () => {
				const { user2, task } = setup();

				await expect(async () => {
					await service.changeFinishedForUser(user2.id, task.id, true);
				}).rejects.toThrow(ForbiddenException);
			});
		});

		describe('without any dashboard permission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId({ creator: user });

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				taskRepo.findById.mockResolvedValue(task);
				task.finishForUser = jest.fn();
				task.restoreForUser = jest.fn();
				taskRepo.save.mockResolvedValue();
				authorizationService.hasOneOfPermissions.mockReturnValueOnce(false);

				return { user, task };
			};

			it('should check for permission to finish the task', async () => {
				const { user, task } = setup();

				await service.changeFinishedForUser(user.id, task.id, true);

				expect(authorizationService.checkPermission).toBeCalledWith(user, task, {
					action: Actions.read,
					requiredPermissions: [],
				});
			});

			it('should finish the task for the user', async () => {
				const { user, task } = setup();

				await service.changeFinishedForUser(user.id, task.id, true);

				expect(task.finishForUser).toBeCalled();
			});

			it('should restore the task for the user', async () => {
				const { user, task } = setup();

				await service.changeFinishedForUser(user.id, task.id, false);

				expect(task.restoreForUser).toBeCalled();
			});

			it('should save the task', async () => {
				const { user, task } = setup();

				await service.changeFinishedForUser(user.id, task.id, true);

				expect(taskRepo.save).toBeCalledWith(task);
			});

			it('should return the task and its status', async () => {
				const { user, task } = setup();

				const result = await service.changeFinishedForUser(user.id, task.id, true);

				expect(result.task).toEqual(task);
				expect(result.status).toBeDefined();
			});
		});

		describe('with teacherDashboard permission', () => {
			const setup = () => {
				const permissions = [Permission.TASK_DASHBOARD_TEACHER_VIEW_V3];
				const user = setupUser(permissions);
				const task = taskFactory.buildWithId({ creator: user });

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				taskRepo.findById.mockResolvedValue(task);
				task.finishForUser = jest.fn();
				task.restoreForUser = jest.fn();
				taskRepo.save.mockResolvedValue();
				authorizationService.hasOneOfPermissions.mockReturnValueOnce(true);
				task.createTeacherStatusForUser = jest.fn().mockReturnValue(mockStatus);

				return { user, task };
			};

			it('should return task and teacher status', async () => {
				const { user, task } = setup();

				const result = await service.changeFinishedForUser(user.id, task.id, true);

				expect(task.createTeacherStatusForUser).toBeCalled();
				expect(result.task).toEqual(task);
				expect(result.status).toEqual(mockStatus);
			});
		});

		describe('with studentDashboard permission', () => {
			const setup = () => {
				const permissions = [Permission.TASK_DASHBOARD_VIEW_V3];
				const user = setupUser(permissions);
				const task = taskFactory.buildWithId({ creator: user });

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				taskRepo.findById.mockResolvedValue(task);
				task.finishForUser = jest.fn();
				task.restoreForUser = jest.fn();
				taskRepo.save.mockResolvedValue();
				authorizationService.hasOneOfPermissions.mockReturnValueOnce(false);
				task.createStudentStatusForUser = jest.fn().mockReturnValue(mockStatus);

				return { user, task };
			};

			it('should return task and student status', async () => {
				const { user, task } = setup();

				const result = await service.changeFinishedForUser(user.id, task.id, true);

				expect(task.createStudentStatusForUser).toBeCalled();
				expect(result.task).toEqual(task);
				expect(result.status).toEqual(mockStatus);
			});
		});
	});

	describe('revertPublished', () => {
		describe('without write permission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId({ creator: user });

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				taskRepo.findById.mockResolvedValue(task);
				authorizationService.checkPermission.mockImplementation(() => {
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
					action: Actions.write,
					requiredPermissions: [],
				});
			});
		});

		describe('with write permission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId({ creator: user });

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				taskRepo.findById.mockResolvedValue(task);
				task.unpublish = jest.fn();
				taskRepo.save.mockResolvedValue();
				task.createTeacherStatusForUser = jest.fn().mockImplementation(() => {
					return {};
				});

				return { user, task };
			};

			it('should call unpublish method in task entity', async () => {
				const { user, task } = setup();

				await service.revertPublished(user.id, task.id);

				expect(task.unpublish).toBeCalled();
			});

			it('should save the task', async () => {
				const { user, task } = setup();

				await service.revertPublished(user.id, task.id);

				expect(taskRepo.save).toBeCalledWith(task);
			});

			it('should create teacher status', async () => {
				const { user, task } = setup();

				await service.revertPublished(user.id, task.id);

				expect(task.createTeacherStatusForUser).toBeCalled();
			});

			it('should return the task and its status', async () => {
				const { user, task } = setup();

				const result = await service.revertPublished(user.id, task.id);

				expect(result.task).toEqual(task);
				expect(result.status).toBeDefined();
			});
		});
	});

	describe('delete task', () => {
		describe('when user has not permission for task', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				taskRepo.findById.mockResolvedValueOnce(task);
				authorizationService.checkPermission.mockImplementation(() => {
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
				taskService.delete.mockResolvedValueOnce();

				return { user, task };
			};

			it('should call authorizationService.hasPermission() with User Task Aktion.write', async () => {
				const { user, task } = setup();

				await service.delete(user.id, task.id);

				expect(authorizationService.checkPermission).toBeCalledWith(user, task, {
					action: Actions.write,
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
