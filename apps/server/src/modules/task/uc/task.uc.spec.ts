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

const mockStatus: ITaskStatus = {
	submitted: 1,
	graded: 1,
	maxSubmissions: 1,
	isDraft: false,
	isSubstitutionTeacher: false,
	isFinished: false,
};

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
	let user!: User;

	const setupUser = (permissions: Permission[]) => {
		const role = roleFactory.build({ permissions });
		user = userFactory.buildWithId({ roles: [role] });
		return user;
	};

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
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

	afterEach(async () => {
		await module.close();
	});

	const setUserRepoMock = {
		findById: () => {
			const spy = userRepo.findById.mockResolvedValue(user);
			return spy;
		},
	};

	const setAuthorizationServiceMock = {
		getUserWithPermissions: () => {
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
		findAllForTeacher: (lessons: Lesson[] = []) => {
			const spy = lessonRepo.findAllByCourseIds.mockResolvedValue([lessons, lessons.length]);
			return spy;
		},
	};

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	const findAllMock = (data?: {
		tasks?: Task[];
		lessons?: Lesson[];
		courses?: Course[];
		hasWritePermission?: boolean;
	}) => {
		const spy1 = setTaskRepoMock.findAllFinishedByParentIds(data?.tasks);
		const spy2 = setCourseRepoMock.findAllForTeacherOrSubstituteTeacher(data?.courses);
		const spy3 = setCourseRepoMock.findAllByUserId(data?.courses);
		const spy4 = setCourseRepoMock.findAllForTeacher(data?.courses);
		const spy5 = setLessonRepoMock.findAllForTeacher(data?.lessons);
		const spy6 = setAuthorizationServiceMock.getUserWithPermissions();
		const spy7 = setUserRepoMock.findById();
		setTaskRepoMock.findAllByParentIds(data?.tasks);

		const mockRestore = () => {
			spy1.mockRestore();
			spy2.mockRestore();
			spy3.mockRestore();
			spy4.mockRestore();
			spy5.mockRestore();
			spy4.mockRestore();
			spy6.mockRestore();
			spy7.mockRestore();
		};

		return mockRestore;
	};
	describe('findAllFinished', () => {
		beforeEach(() => {
			const permissions = [Permission.TASK_DASHBOARD_VIEW_V3];
			user = setupUser(permissions);
		});

		it('should call auth getUserWithPermissions() with userId', async () => {
			const mockRestore = findAllMock();

			await service.findAllFinished(user.id);

			expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(user.id);

			mockRestore();
		});

		it('should return task for a user', async () => {
			const task = taskFactory.finished(user).build();
			const mockRestore = findAllMock({ tasks: [task] });

			const [, total] = await service.findAllFinished(user.id);

			expect(total).toEqual(1);

			mockRestore();
		});

		it('should call task repo findAllFinishedByParentIds', async () => {
			const mockRestore = findAllMock({});
			const spy = setTaskRepoMock.findAllFinishedByParentIds();

			await service.findAllFinished(user.id);

			expect(spy).toHaveBeenCalled();

			mockRestore();
		});

		it('should call task repo findAllFinishedByParentIds for finished tasks', async () => {
			const mockRestore = findAllMock({});
			const spy = setTaskRepoMock.findAllFinishedByParentIds();

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
			expect(spy).toHaveBeenCalledWith(...expectedParams);

			mockRestore();
		});

		it('should return a counted type', async () => {
			const mockRestore = findAllMock({});

			const [data, count] = await service.findAllFinished(user.id);

			expect(typeof count).toBe('number');
			expect(Array.isArray(data)).toBe(true);

			mockRestore();
		});

		it('should return read status vo for tasks', async () => {
			const student = user;
			const task = taskFactory.finished(student).build();
			const mockRestore = findAllMock({ tasks: [task] });
			const status = task.createStudentStatusForUser(student);
			authorizationService.hasPermission.mockReturnValue(false);

			const [data] = await service.findAllFinished(student.id);

			expect(data[0].task).toEqual(task);
			expect(data[0].status).toEqual(status);
			expect(data[0]).toEqual({ task, status });

			mockRestore();
		});

		it('should pass skip option', async () => {
			const mockRestore = findAllMock({});
			const spy = setTaskRepoMock.findAllFinishedByParentIds();
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
				{ pagination: { skip: 5 }, order: { dueDate: SortOrder.desc } },
			];
			expect(spy).toHaveBeenCalledWith(...expectedParams);

			mockRestore();
		});

		it('should pass limit option', async () => {
			const mockRestore = findAllMock({});
			const spy = setTaskRepoMock.findAllFinishedByParentIds();
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
				{ pagination: { limit: 5 }, order: { dueDate: SortOrder.desc } },
			];
			expect(spy).toHaveBeenCalledWith(...expectedParams);

			mockRestore();
		});

		it('should used permitted lessons for search finished tasks', async () => {
			const lesson = lessonFactory.buildWithId();
			const mockRestore = findAllMock({ lessons: [lesson] });
			const spy = setTaskRepoMock.findAllFinishedByParentIds();
			lessonRepo.findAllByCourseIds.mockResolvedValueOnce([[lesson], 1]);
			lessonRepo.findAllByCourseIds.mockResolvedValueOnce([[], 0]);

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
			expect(spy).toHaveBeenCalledWith(...expectedParams);

			mockRestore();
		});

		it('should used permitted courses for search finished tasks', async () => {
			const course = courseFactory.buildWithId();
			const mockRestore = findAllMock({ courses: [course] });
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

			mockRestore();
		});

		describe('when user hasWritePermission and has teacherDashboard permission', () => {
			beforeEach(() => {
				const permissions = [Permission.TASK_DASHBOARD_TEACHER_VIEW_V3];
				user = setupUser(permissions);
			});

			it('should return finished tasks', async () => {
				const task = taskFactory.finished(user).build();
				const mockRestore = findAllMock({
					tasks: [task],
					hasWritePermission: true,
				});

				const [, total] = await service.findAllFinished(user.id);

				expect(total).toEqual(1);

				mockRestore();
			});

			it('should select the right status', async () => {
				const course = courseFactory.build({ teachers: [user] });
				const task = taskFactory.finished(user).build({ course });
				const mockRestore = findAllMock({
					tasks: [task],
					courses: [course],
					hasWritePermission: true,
				});

				const spy = jest.spyOn(task, 'createTeacherStatusForUser');

				await service.findAllFinished(user.id);

				expect(spy).toHaveBeenCalled();

				mockRestore();
			});
		});

		describe('when user has no task overview permissions', () => {
			beforeEach(() => {
				const permissions = [];
				user = setupUser(permissions);
			});

			it('should fail with UnauthorizedException', async () => {
				const mockRestore = findAllMock({});
				authorizationService.checkOneOfPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});
				await expect(() => service.findAllFinished(user.id)).rejects.toThrow(UnauthorizedException);

				mockRestore();
			});
		});
	});

	describe('findAll', () => {
		beforeEach(() => {
			const permissions = [Permission.TASK_DASHBOARD_VIEW_V3];
			user = setupUser(permissions);
		});

		it('should call authorizationService.hasAllPermissions with [Permission.TASK_DASHBOARD_VIEW_V3]', async () => {
			const permissions = [];
			user = setupUser(permissions);
			const mockRestore = findAllMock();

			const paginationParams = new PaginationParams();
			await service.findAll(user.id, paginationParams);
			expect(authorizationService.hasAllPermissions).toBeCalledWith(user, [Permission.TASK_DASHBOARD_VIEW_V3]);
			mockRestore();
		});

		it('should call authorizationService.hasAllPermissions with [Permission.TASK_DASHBOARD_TEACHER_VIEW_V3]', async () => {
			const permissions = [];
			user = setupUser(permissions);
			const mockRestore = findAllMock();
			authorizationService.hasAllPermissions.mockReturnValueOnce(false);
			const paginationParams = new PaginationParams();
			await service.findAll(user.id, paginationParams);
			expect(authorizationService.hasAllPermissions).toBeCalledWith(user, [Permission.TASK_DASHBOARD_TEACHER_VIEW_V3]);
			mockRestore();
		});

		it('should throw if user has no required permission', async () => {
			const permissions = [];
			user = setupUser(permissions);
			const mockRestore = findAllMock();
			authorizationService.hasAllPermissions.mockReturnValue(false);

			const paginationParams = new PaginationParams();
			const action = async () => service.findAll(user.id, paginationParams);
			await expect(action()).rejects.toThrow();
			mockRestore();
		});

		it(`should pass if user has ${Permission.TASK_DASHBOARD_VIEW_V3} permission`, async () => {
			const mockRestore = findAllMock({});

			const paginationParams = new PaginationParams();
			const result = await service.findAll(user.id, paginationParams);

			expect(result).toEqual([[], 0]);

			mockRestore();
		});

		it(`should pass if user has ${Permission.TASK_DASHBOARD_TEACHER_VIEW_V3} permission`, async () => {
			const mockRestore = findAllMock({});

			const paginationParams = new PaginationParams();
			const result = await service.findAll(user.id, paginationParams);

			expect(result).toEqual([[], 0]);

			mockRestore();
		});

		describe('as a student', () => {
			beforeEach(() => {
				const permissions = [Permission.TASK_DASHBOARD_VIEW_V3];
				user = setupUser(permissions);
			});

			it('should return a counted result', async () => {
				const mockRestore = findAllMock({});

				const paginationParams = new PaginationParams();
				const [result, count] = await service.findAll(user.id, paginationParams);
				expect(Array.isArray(result)).toBeTruthy();
				expect(count).toEqual(0);

				mockRestore();
			});

			it('should find current tasks by permitted parent ids ordered by dueDate', async () => {
				const spy = setTaskRepoMock.findAllByParentIds([]);
				const course = courseFactory.buildWithId();
				const lesson = lessonFactory.buildWithId({ course, hidden: false });

				const mockRestore = findAllMock({
					lessons: [lesson],
					courses: [course],
				});
				lessonRepo.findAllByCourseIds.mockResolvedValueOnce([[lesson], 1]);
				lessonRepo.findAllByCourseIds.mockResolvedValueOnce([[], 0]);
				const paginationParams = new PaginationParams();
				await service.findAll(user.id, paginationParams);

				expect(spy).toHaveBeenCalledTimes(1);
				expect(spy.mock.calls[0][0]).toEqual({
					creatorId: user.id,
					courseIds: [course.id],
					lessonIds: [lesson.id],
				});
				expect(spy.mock.calls[0][1]?.finished).toEqual({ userId: user.id, value: false });
				expect(spy.mock.calls[0][1]?.afterDueDateOrNone).toBeDefined();
				expect(spy.mock.calls[0][2]).toEqual({
					order: { dueDate: 'asc' },
					pagination: { skip: paginationParams.skip, limit: paginationParams.limit },
				});

				spy.mockRestore();
				mockRestore();
			});

			it('should return well formed task with course and status', async () => {
				const course = courseFactory.build();
				const task = taskFactory.build({ course });

				const mockRestore = findAllMock({
					tasks: [task],
				});

				const paginationParams = new PaginationParams();
				const [result] = await service.findAll(user.id, paginationParams);
				expect(result[0]).toEqual({
					task,
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

				mockRestore();
			});

			it('should find a list of tasks', async () => {
				const course = courseFactory.build();
				const task1 = taskFactory.build({ course });
				const task2 = taskFactory.build({ course });
				const task3 = taskFactory.build({ course });

				const mockRestore = findAllMock({
					tasks: [task1, task2, task3],
				});

				const paginationParams = new PaginationParams();
				const [result, count] = await service.findAll(user.id, paginationParams);
				expect(count).toEqual(3);
				expect(result.length).toEqual(3);

				mockRestore();
			});

			it('should compute submitted status for task', async () => {
				const student = user;
				const course = courseFactory.build();
				const task = taskFactory.build({ course });
				task.submissions.add(submissionFactory.submitted().build({ task, student }));

				const mockRestore = findAllMock({ tasks: [task] });

				const paginationParams = new PaginationParams();
				const [result] = await service.findAll(user.id, paginationParams);

				expect(result.length).toEqual(1);
				expect(result[0].status).toEqual({
					graded: 0,
					submitted: 1,
					maxSubmissions: 1,
					isDraft: false,
					isFinished: false,
					isSubstitutionTeacher: false,
				});

				mockRestore();
			});

			it('should only count the submissions of the given user', async () => {
				const student1 = user;
				const student2 = userFactory.build();
				const course = courseFactory.build();
				const task = taskFactory.build({ course });
				task.submissions.add(submissionFactory.submitted().build({ task, student: student1 }));
				task.submissions.add(submissionFactory.submitted().build({ task, student: student2 }));

				const mockRestore = findAllMock({ tasks: [task] });

				const paginationParams = new PaginationParams();
				const [result] = await service.findAll(user.id, paginationParams);

				expect(result.length).toEqual(1);
				expect(result[0].status).toEqual({
					graded: 0,
					submitted: 1,
					maxSubmissions: 1,
					isDraft: false,
					isFinished: false,
					isSubstitutionTeacher: false,
				});

				mockRestore();
			});

			it('should compute graded status for task', async () => {
				const student = user;
				const course = courseFactory.build();
				const task = taskFactory.build({ course });
				const submission = submissionFactory.submitted().build({ task, student });
				task.submissions.add(submission);

				const spyGraded = jest.spyOn(submission, 'isGraded').mockImplementation(() => true);
				const mockRestore = findAllMock({ tasks: [task] });

				const paginationParams = new PaginationParams();
				const [result] = await service.findAll(user.id, paginationParams);

				expect(spyGraded).toBeCalled();
				expect(result.length).toEqual(1);
				expect(result[0].status).toEqual({
					graded: 1,
					submitted: 1,
					maxSubmissions: 1,
					isDraft: false,
					isFinished: false,
					isSubstitutionTeacher: false,
				});

				mockRestore();
				spyGraded.mockRestore();
			});

			it('should only count the graded submissions of the given user', async () => {
				const student1 = user;
				const student2 = userFactory.build();
				const course = courseFactory.build();
				const task = taskFactory.build({ course });
				const submission1 = submissionFactory.submitted().build({ task, student: student1 });
				const submission2 = submissionFactory.submitted().build({ task, student: student2 });
				task.submissions.add(submission1, submission2);

				jest.spyOn(submission1, 'isGraded').mockImplementation(() => true);
				jest.spyOn(submission2, 'isGraded').mockImplementation(() => true);
				const mockRestore = findAllMock({ tasks: [task] });

				const paginationParams = new PaginationParams();
				const [result] = await service.findAll(user.id, paginationParams);

				expect(result.length).toEqual(1);
				expect(result[0].status).toEqual({
					graded: 1,
					submitted: 1,
					maxSubmissions: 1,
					isDraft: false,
					isFinished: false,
					isSubstitutionTeacher: false,
				});

				mockRestore();
			});
		});

		describe('as a teacher', () => {
			beforeEach(() => {
				const permissions = [Permission.TASK_DASHBOARD_TEACHER_VIEW_V3];
				user = setupUser(permissions);
				authorizationService.hasAllPermissions.mockReturnValueOnce(false);
				authorizationService.hasAllPermissions.mockReturnValueOnce(true);
			});

			it('should return a counted result', async () => {
				const mockRestore = findAllMock({});

				const paginationParams = new PaginationParams();
				const [result, count] = await service.findAll(user.id, paginationParams);
				expect(Array.isArray(result)).toBeTruthy();
				expect(count).toEqual(0);

				mockRestore();
			});

			it('should find all tasks by permitted parent ids ordered by newest first', async () => {
				const course = courseFactory.buildWithId();
				const lesson = lessonFactory.buildWithId({ course, hidden: false });
				const tasks = [];
				const mockRestore = findAllMock({
					tasks,
					lessons: [lesson],
					courses: [course],
				});
				const spy = setTaskRepoMock.findAllByParentIds(tasks);
				lessonRepo.findAllByCourseIds.mockResolvedValueOnce([[lesson], 1]);
				lessonRepo.findAllByCourseIds.mockResolvedValueOnce([[], 0]);

				const paginationParams = new PaginationParams();
				await service.findAll(user.id, paginationParams);

				const notFinished = { userId: user.id, value: false };
				const expectedParams = [
					{ creatorId: user.id, courseIds: [course.id], lessonIds: [lesson.id] },
					{ finished: notFinished, availableOn: expect.any(Date) },
					{ order: { dueDate: 'desc' }, pagination: { skip: paginationParams.skip, limit: paginationParams.limit } },
				];

				expect(spy).toHaveBeenCalledWith(...expectedParams);

				mockRestore();
			});

			it('should return well formed task with course and status', async () => {
				const course = courseFactory.build();
				const task = taskFactory.draft().build({ course });

				const mockRestore = findAllMock({ tasks: [task] });

				const paginationParams = new PaginationParams();
				const [result] = await service.findAll(user.id, paginationParams);
				expect(result[0]).toEqual({
					task,
					status: {
						submitted: 0,
						maxSubmissions: course.getStudentIds().length,
						graded: 0,
						isDraft: true,
						isFinished: false,
						isSubstitutionTeacher: false,
					},
				});
				expect(result[0].task.course).toBeDefined();

				mockRestore();
			});

			it('should mark substitution teacher in status', async () => {
				const userData = user;
				const course = courseFactory.build({ substitutionTeachers: [userData] });
				const task = taskFactory.build({ course });

				const mockRestore = findAllMock({ tasks: [task] });

				const paginationParams = new PaginationParams();
				const [result] = await service.findAll(userData.id, paginationParams);
				expect(result[0].status.isSubstitutionTeacher).toBe(true);

				mockRestore();
			});

			it('should find a list of tasks', async () => {
				const course = courseFactory.build();
				const task1 = taskFactory.build({ course });
				const task2 = taskFactory.build({ course });
				const task3 = taskFactory.build({ course });

				const mockRestore = findAllMock({
					tasks: [task1, task2, task3],
				});

				const paginationParams = new PaginationParams();
				const [result, count] = await service.findAll(user.id, paginationParams);
				expect(count).toEqual(3);
				expect(result.length).toEqual(3);

				mockRestore();
			});

			it('should compute submitted status for task', async () => {
				const student = user;
				const course = courseFactory.build();
				const task = taskFactory.build({ course });
				task.submissions.add(submissionFactory.submitted().build({ task, student }));

				const mockRestore = findAllMock({ tasks: [task] });

				const paginationParams = new PaginationParams();
				const [result] = await service.findAll(user.id, paginationParams);

				expect(result.length).toEqual(1);
				expect(result[0].status).toEqual({
					graded: 0,
					submitted: 1,
					maxSubmissions: course.getStudentIds().length,
					isDraft: false,
					isFinished: false,
					isSubstitutionTeacher: false,
				});

				mockRestore();
			});

			it('should count all student ids of submissions', async () => {
				const student1 = userFactory.buildWithId();
				const student2 = userFactory.buildWithId();
				const course = courseFactory.build();
				const task = taskFactory.build({ course });
				const submission1 = submissionFactory.submitted().build({ task, student: student1 });
				const submission2 = submissionFactory.submitted().build({ task, student: student2 });
				task.submissions.add(submission1, submission2);

				const mockRestore = findAllMock({ tasks: [task] });

				const paginationParams = new PaginationParams();
				const [result] = await service.findAll(user.id, paginationParams);

				expect(result.length).toEqual(1);
				expect(result[0].status).toEqual({
					graded: 0,
					submitted: 2,
					maxSubmissions: course.getStudentIds().length,
					isDraft: false,
					isFinished: false,
					isSubstitutionTeacher: false,
				});

				mockRestore();
			});

			it('should compute graded status for task', async () => {
				const student = userFactory.build();
				const course = courseFactory.build();
				const task = taskFactory.build({ course });
				const submission = submissionFactory.submitted().build({ task, student });
				task.submissions.add(submission);

				const spyGraded = jest.spyOn(submission, 'isGraded').mockImplementation(() => true);
				const mockRestore = findAllMock({ tasks: [task] });

				const paginationParams = new PaginationParams();
				const [result] = await service.findAll(user.id, paginationParams);

				expect(spyGraded).toBeCalled();
				expect(result.length).toEqual(1);
				expect(result[0].status).toEqual({
					graded: 1,
					submitted: 1,
					maxSubmissions: course.getStudentIds().length,
					isDraft: false,
					isFinished: false,
					isSubstitutionTeacher: false,
				});

				mockRestore();
				spyGraded.mockRestore();
			});

			it('should count all student ids of graded submissions', async () => {
				const student1 = user;
				const student2 = userFactory.build();
				const course = courseFactory.build();
				const task = taskFactory.build({ course });
				const submission1 = submissionFactory.submitted().build({ task, student: student1 });
				const submission2 = submissionFactory.submitted().build({ task, student: student2 });
				task.submissions.add(submission1, submission2);

				jest.spyOn(submission1, 'isGraded').mockImplementation(() => true);
				jest.spyOn(submission2, 'isGraded').mockImplementation(() => true);
				const mockRestore = findAllMock({ tasks: [task] });

				const paginationParams = new PaginationParams();
				const [result] = await service.findAll(user.id, paginationParams);

				expect(result.length).toEqual(1);
				expect(result[0].status).toEqual({
					graded: 2,
					submitted: 2,
					maxSubmissions: course.getStudentIds().length,
					isDraft: false,
					isFinished: false,
					isSubstitutionTeacher: false,
				});

				mockRestore();
			});

			it('should count only unique student ids of graded submissions', async () => {
				const student1 = user;
				const student2 = userFactory.build();
				const course = courseFactory.build();
				const task = taskFactory.build({ course });
				const submission1 = submissionFactory.submitted().build({ task, student: student1 });
				const submission2 = submissionFactory.submitted().build({ task, student: student2 });
				const submission3 = submissionFactory.submitted().build({ task, student: student2 });

				task.submissions.add(submission1, submission2, submission3);

				jest.spyOn(submission1, 'isGraded').mockImplementation(() => true);
				jest.spyOn(submission2, 'isGraded').mockImplementation(() => true);
				jest.spyOn(submission3, 'isGraded').mockImplementation(() => true);
				const mockRestore = findAllMock({ tasks: [task] });

				const paginationParams = new PaginationParams();
				const [result, total] = await service.findAll(user.id, paginationParams);

				expect(total).toEqual(1);
				expect(result[0].status).toEqual({
					graded: 2,
					submitted: 2,
					maxSubmissions: course.getStudentIds().length,
					isDraft: false,
					isFinished: false,
					isSubstitutionTeacher: false,
				});

				mockRestore();
			});

			it('should count only unique student ids of submissions', async () => {
				const student1 = userFactory.buildWithId();
				const student2 = userFactory.buildWithId();
				const course = courseFactory.build();
				const task = taskFactory.build({ course });
				const submission1 = submissionFactory.submitted().build({ task, student: student1 });
				const submission2 = submissionFactory.submitted().build({ task, student: student1 });
				const submission3 = submissionFactory.submitted().build({ task, student: student2 });

				task.submissions.add(submission1, submission2, submission3);

				const mockRestore = findAllMock({ tasks: [task] });

				const paginationParams = new PaginationParams();
				const [result, total] = await service.findAll(user.id, paginationParams);

				expect(total).toEqual(1);
				expect(result[0].status).toEqual({
					graded: 0,
					submitted: 2,
					maxSubmissions: course.getStudentIds().length,
					isDraft: false,
					isFinished: false,
					isSubstitutionTeacher: false,
				});

				mockRestore();
			});
		});
	});

	describe('changeFinishedForUser', () => {
		let task: Task;

		beforeEach(() => {
			user = userFactory.buildWithId();
			task = taskFactory.buildWithId({ creator: user });
			userRepo.findById.mockResolvedValue(user);
			taskRepo.findById.mockResolvedValue(task);
			taskRepo.save.mockResolvedValue();
		});

		it('should check for permission to finish the task', async () => {
			await service.changeFinishedForUser(user.id, task.id, true);
			expect(authorizationService.checkPermission).toBeCalledWith(user, task, {
				action: Actions.read,
				requiredPermissions: [],
			});
		});

		it('should throw ForbiddenException when not permitted', async () => {
			const user2 = userFactory.buildWithId();
			task = taskFactory.buildWithId({ creator: user2 });
			taskRepo.findById.mockResolvedValue(task);
			authorizationService.checkPermission.mockImplementation(() => {
				throw new ForbiddenException();
			});
			await expect(async () => {
				await service.changeFinishedForUser(user.id, task.id, true);
			}).rejects.toThrow(ForbiddenException);
		});

		it('should finish the task for the user', async () => {
			task.finishForUser = jest.fn();
			await service.changeFinishedForUser(user.id, task.id, true);
			expect(task.finishForUser).toBeCalled();
		});

		it('should restore the task for the user', async () => {
			task.restoreForUser = jest.fn();
			await service.changeFinishedForUser(user.id, task.id, false);
			expect(task.restoreForUser).toBeCalled();
		});

		it('should save the task', async () => {
			await service.changeFinishedForUser(user.id, task.id, true);
			expect(taskRepo.save).toBeCalledWith(task);
		});

		it('should return the task and its status', async () => {
			const result = await service.changeFinishedForUser(user.id, task.id, true);
			expect(result.task).toEqual(task);
			expect(result.status).toBeDefined();
		});

		describe('with teacherDashboard permission', () => {
			beforeEach(() => {
				const permissions = [Permission.TASK_DASHBOARD_TEACHER_VIEW_V3];
				user = setupUser(permissions);
				task = taskFactory.buildWithId({ creator: user });
				userRepo.findById.mockResolvedValue(user);
				taskRepo.findById.mockResolvedValue(task);
				taskRepo.save.mockResolvedValue();
			});

			it('should create teacher status', async () => {
				task.createTeacherStatusForUser = jest.fn();
				await service.changeFinishedForUser(user.id, task.id, true);
				expect(task.createTeacherStatusForUser).toBeCalled();
			});

			it('should return task and teacher status', async () => {
				task.createTeacherStatusForUser = jest.fn().mockReturnValue(mockStatus);
				const result = await service.changeFinishedForUser(user.id, task.id, true);
				expect(result.task).toEqual(task);
				expect(result.status).toEqual(mockStatus);
			});
		});

		describe('with studentDashboard permission', () => {
			it('should create teacher status', async () => {
				task.createStudentStatusForUser = jest.fn();
				authorizationService.hasPermission.mockReturnValue(true);
				authorizationService.hasOneOfPermissions.mockReturnValue(false);
				await service.changeFinishedForUser(user.id, task.id, true);
				expect(task.createStudentStatusForUser).toBeCalled();
			});

			it('should return task and student status', async () => {
				task.createStudentStatusForUser = jest.fn().mockReturnValue(mockStatus);
				authorizationService.hasPermission.mockReturnValue(true);
				authorizationService.hasOneOfPermissions.mockReturnValue(false);
				const result = await service.changeFinishedForUser(user.id, task.id, true);
				expect(result.task).toEqual(task);
				expect(result.status).toEqual(mockStatus);
			});
		});
	});

	describe('revertPublished', () => {
		let task: Task;

		beforeEach(() => {
			user = userFactory.buildWithId();
			task = taskFactory.buildWithId({ creator: user });
			userRepo.findById.mockResolvedValue(user);
			taskRepo.findById.mockResolvedValue(task);
			taskRepo.save.mockResolvedValue();
		});

		it('should check for permission to revert the task', async () => {
			await service.revertPublished(user.id, task.id);
			expect(authorizationService.checkPermission).toBeCalledWith(user, task, {
				action: Actions.write,
				requiredPermissions: [],
			});
		});

		it('should throw ForbiddenException when not permitted', async () => {
			const user2 = userFactory.buildWithId();
			task = taskFactory.buildWithId({ creator: user2 });
			taskRepo.findById.mockResolvedValue(task);
			authorizationService.checkPermission.mockImplementation(() => {
				throw new ForbiddenException();
			});
			await expect(async () => {
				await service.revertPublished(user.id, task.id);
			}).rejects.toThrow(ForbiddenException);
		});

		it('should call unpublish method in task entity', async () => {
			task.unpublish = jest.fn();
			await service.revertPublished(user.id, task.id);
			expect(task.unpublish).toBeCalled();
		});

		it('should set the private property of unpublished task correctly', async () => {
			expect(task.private).toEqual(false);
			await service.revertPublished(user.id, task.id);
			expect(task.private).toEqual(true);
		});

		it('should save the task', async () => {
			await service.revertPublished(user.id, task.id);
			expect(taskRepo.save).toBeCalledWith(task);
		});

		it('should create teacher status', async () => {
			task.createTeacherStatusForUser = jest.fn();
			await service.revertPublished(user.id, task.id);
			expect(task.createTeacherStatusForUser).toBeCalled();
		});

		it('should return the task and its status', async () => {
			const result = await service.revertPublished(user.id, task.id);
			expect(result.task).toEqual(task);
			expect(result.status).toBeDefined();
		});
	});

	describe('delete task', () => {
		let task: Task;

		beforeEach(() => {
			user = userFactory.buildWithId();
			task = taskFactory.buildWithId({ creator: user });
			userRepo.findById.mockResolvedValue(user);
			taskRepo.findById.mockResolvedValue(task);
		});

		it('should throw ForbiddenException when not permitted', async () => {
			task = taskFactory.buildWithId();
			taskRepo.findById.mockResolvedValue(task);
			authorizationService.checkPermission.mockImplementation(() => {
				throw new ForbiddenException();
			});

			await expect(async () => {
				await service.delete(user.id, task.id);
			}).rejects.toThrow(new ForbiddenException());
		});

		it('should call authorizationService.hasPermission() with User Task Aktion.write', async () => {
			await service.delete(user.id, task.id);

			expect(authorizationService.checkPermission).toBeCalledWith(user, task, {
				action: Actions.write,
				requiredPermissions: [],
			});
		});

		it('should call taskService.delete', async () => {
			await service.delete(user.id, task.id);

			expect(taskService.delete).toBeCalledWith(task);
		});

		it('should pass error when taskService.delete rejects', async () => {
			const error = new Error('test message');
			taskService.delete.mockRejectedValue(error);

			await expect(() => service.delete(user.id, task.id)).rejects.toThrow(error);
		});

		it('should return true when there is no exception', async () => {
			const result = await service.delete(user.id, task.id);

			expect(result).toBe(true);
		});
	});
});
