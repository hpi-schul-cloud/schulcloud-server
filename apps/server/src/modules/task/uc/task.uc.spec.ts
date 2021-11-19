import { Test, TestingModule } from '@nestjs/testing';

import { PaginationQuery } from '@shared/controller';
import { Course, ICurrentUser, Task, Lesson } from '@shared/domain';
import {
	userFactory,
	courseFactory,
	lessonFactory,
	taskFactory,
	submissionFactory,
	createCurrentTestUser,
} from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { TaskRepo } from '@shared/repo';

import { TaskUC, TaskDashBoardPermission } from './task.uc';
import { TaskAuthorizationService, TaskParentPermission } from './task.authorization.service';

// TODO: add courseGroups tests
// TODO: what about ignoredTask?

describe('TaskUC', () => {
	let module: TestingModule;
	let service: TaskUC;
	let taskRepo: TaskRepo;
	let authorizationService: TaskAuthorizationService;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				TaskUC,
				{
					provide: TaskRepo,
					useValue: {
						findAllByParentIds() {
							throw new Error('Please write a mock for TaskRepo.findAllByParentIds');
						},
						findAllFinishedByParentIds() {
							throw new Error('Please write a mock for TaskRepo.findAllFinishedByParentIds');
						},
					},
				},
				{
					provide: TaskAuthorizationService,
					useValue: {
						getPermittedCourses() {
							throw new Error('Please write a mock for TaskAuthorizationService.getPermittedCourses');
						},
						getPermittedLessons() {
							throw new Error('Please write a mock for TaskAuthorizationService.getPermittedLessons');
						},
					},
				},
			],
		}).compile();

		service = module.get(TaskUC);
		taskRepo = module.get(TaskRepo);
		authorizationService = module.get(TaskAuthorizationService);
	});

	afterEach(async () => {
		await module.close();
	});

	const setTaskRepoMock = {
		findAllByParentIds: (tasks: Task[] = []) => {
			const spy = jest
				.spyOn(taskRepo, 'findAllByParentIds')
				.mockImplementation(() => Promise.resolve([tasks, tasks.length]));

			return spy;
		},
		findAllFinishedByParentIds: (tasks: Task[] = []) => {
			const spy = jest
				.spyOn(taskRepo, 'findAllFinishedByParentIds')
				.mockImplementation(() => Promise.resolve([tasks, tasks.length]));

			return spy;
		},
	};

	const setAuthorizationServiceMock = {
		getPermittedCourses: (courses: Course[] = []) => {
			const spy = jest
				.spyOn(authorizationService, 'getPermittedCourses')
				.mockImplementation(() => Promise.resolve(courses));

			return spy;
		},
		getPermittedLessons: (lessons: Lesson[] = []) => {
			const spy = jest
				.spyOn(authorizationService, 'getPermittedLessons')
				.mockImplementation(() => Promise.resolve(lessons));

			return spy;
		},
	};

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('findAllFinished', () => {
		const findAllMock = (tasks?: Task[], lessons?: Lesson[], courses?: Course[]) => {
			const spy1 = setTaskRepoMock.findAllFinishedByParentIds(tasks);
			const spy2 = setAuthorizationServiceMock.getPermittedCourses(courses);
			const spy3 = setAuthorizationServiceMock.getPermittedLessons(lessons);

			const mockRestore = () => {
				spy1.mockRestore();
				spy2.mockRestore();
				spy3.mockRestore();
			};

			return mockRestore;
		};

		it('should return task for a user', async () => {
			const user = userFactory.buildWithId();
			const task = taskFactory.finished(user).buildWithId();
			const mockRestore = findAllMock([task]);

			const [, total] = await service.findAllFinished(user.id);

			expect(total).toEqual(1);

			mockRestore();
		});

		it('should call task repo findAllFinishedByParentIds', async () => {
			const user = userFactory.buildWithId();
			const mockRestore = findAllMock();
			const spy = setTaskRepoMock.findAllFinishedByParentIds();

			await service.findAllFinished(user.id);

			expect(spy).toHaveBeenCalled();

			mockRestore();
		});

		it('should call task repo findAllFinishedByParentIds for finished tasks', async () => {
			const user = userFactory.buildWithId();
			const mockRestore = findAllMock();
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
				{ pagination: undefined },
			];
			expect(spy).toHaveBeenCalledWith(...expectedParams);

			mockRestore();
		});

		it('should call authorization service getPermittedCourses', async () => {
			const user = userFactory.buildWithId();
			const mockRestore = findAllMock();
			const spy = setAuthorizationServiceMock.getPermittedCourses();

			await service.findAllFinished(user.id);

			expect(spy).toHaveBeenCalled();

			mockRestore();
		});

		it('should call authorization service getPermittedLessons', async () => {
			const user = userFactory.buildWithId();
			const mockRestore = findAllMock();
			const spy = setAuthorizationServiceMock.getPermittedLessons();

			await service.findAllFinished(user.id);

			expect(spy).toHaveBeenCalled();

			mockRestore();
		});

		it('should return a counted type', async () => {
			const user = userFactory.buildWithId();
			const task = taskFactory.finished(user).buildWithId();
			const mockRestore = findAllMock([task]);

			const result = await service.findAllFinished(user.id);

			expect(result).toEqual([[task], 1]);

			mockRestore();
		});

		it('should pass skip option', async () => {
			const user = userFactory.buildWithId();
			const mockRestore = findAllMock();
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
				{ pagination: { skip: 5 } },
			];
			expect(spy).toHaveBeenCalledWith(...expectedParams);

			mockRestore();
		});

		it('should pass limit option', async () => {
			const user = userFactory.buildWithId();
			const mockRestore = findAllMock();
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
				{ pagination: { limit: 5 } },
			];
			expect(spy).toHaveBeenCalledWith(...expectedParams);

			mockRestore();
		});

		it('should used permitted lessons for search finished tasks', async () => {
			const user = userFactory.buildWithId();
			const lesson = lessonFactory.buildWithId();
			const mockRestore = findAllMock([], [lesson]);
			const spy = setTaskRepoMock.findAllFinishedByParentIds();

			await service.findAllFinished(user.id);

			const expectedParams = [
				{
					creatorId: user.id,
					openCourseIds: [],
					finishedCourseIds: [],
					lessonIdsOfOpenCourses: [lesson.id],
					lessonIdsOfFinishedCourses: [],
				},
				{ pagination: undefined },
			];
			expect(spy).toHaveBeenCalledWith(...expectedParams);

			mockRestore();
		});

		it('should used permitted courses for search finished tasks', async () => {
			const user = userFactory.buildWithId();
			const course = courseFactory.buildWithId();
			const mockRestore = findAllMock([], [], [course]);
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
				{ pagination: undefined },
			];
			expect(spy).toHaveBeenCalledWith(...expectedParams);

			mockRestore();
		});
	});

	describe('findAll', () => {
		const findAllMock = () => {
			const spy1 = setTaskRepoMock.findAllByParentIds();
			const spy2 = setAuthorizationServiceMock.getPermittedCourses();
			const spy3 = setAuthorizationServiceMock.getPermittedLessons();

			const mockRestore = () => {
				spy1.mockRestore();
				spy2.mockRestore();
				spy3.mockRestore();
			};

			return mockRestore;
		};

		it('should throw if user has no required permission', async () => {
			const permissions = [];
			const { currentUser } = createCurrentTestUser(permissions);

			const mockRestore = findAllMock();

			const paginationQuery = new PaginationQuery();
			const action = async () => service.findAll(currentUser, paginationQuery);
			await expect(action()).rejects.toThrow();

			mockRestore();
		});

		it(`should pass if user has ${TaskDashBoardPermission.studentDashboard} permission`, async () => {
			const permissions = [TaskDashBoardPermission.studentDashboard];
			const { currentUser } = createCurrentTestUser(permissions);

			const mockRestore = findAllMock();

			const paginationQuery = new PaginationQuery();
			const result = await service.findAll(currentUser, paginationQuery);

			expect(result).toEqual([[], 0]);

			mockRestore();
		});

		it(`should pass if user has ${TaskDashBoardPermission.teacherDashboard} permission`, async () => {
			const permissions = [TaskDashBoardPermission.teacherDashboard];
			const { currentUser } = createCurrentTestUser(permissions);

			const mockRestore = findAllMock();

			const paginationQuery = new PaginationQuery();
			const result = await service.findAll(currentUser, paginationQuery);

			expect(result).toEqual([[], 0]);

			mockRestore();
		});
	});

	describe('as a student', () => {
		let currentUser: ICurrentUser;

		const mockAll = (tasks?: Task[], lessons?: Lesson[], courses?: Course[]) => {
			const spy1 = setTaskRepoMock.findAllByParentIds(tasks);
			const spy2 = setAuthorizationServiceMock.getPermittedLessons(lessons);
			const spy3 = setAuthorizationServiceMock.getPermittedCourses(courses);

			const mockRestore = () => {
				spy1.mockRestore();
				spy2.mockRestore();
				spy3.mockRestore();
			};

			return mockRestore;
		};

		beforeEach(() => {
			const permissions = [TaskDashBoardPermission.studentDashboard];
			({ currentUser } = createCurrentTestUser(permissions));
		});

		it('should get parent ids for student role', async () => {
			const mockRestore = mockAll();
			const spy = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			await service.findAll(currentUser, paginationQuery);

			const expectedParams = [currentUser.userId, TaskParentPermission.read];
			expect(spy).toHaveBeenCalledWith(...expectedParams);

			mockRestore();
		});

		it('should return a counted result', async () => {
			const mockRestore = mockAll();

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAll(currentUser, paginationQuery);
			expect(Array.isArray(result)).toBeTruthy();
			expect(count).toEqual(0);

			mockRestore();
		});

		it('should find current tasks by permitted parent ids ordered by dueDate', async () => {
			const spy = setTaskRepoMock.findAllByParentIds([]);
			const course = courseFactory.buildWithId();
			const lesson = lessonFactory.buildWithId({ course, hidden: false });

			const spyGetPermittedLessons = setAuthorizationServiceMock.getPermittedLessons([lesson]);
			const spygetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses([course]);

			const paginationQuery = new PaginationQuery();
			await service.findAll(currentUser, paginationQuery);

			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy.mock.calls[0][0]).toEqual({
				courseIds: [course.id],
				lessonIds: [lesson.id],
			});
			expect(spy.mock.calls[0][1]?.draft).toEqual(false);
			expect(spy.mock.calls[0][1]?.closed).toEqual({ userId: currentUser.userId, value: false });
			expect(spy.mock.calls[0][1]?.afterDueDateOrNone).toBeDefined();
			expect(spy.mock.calls[0][2]).toEqual({
				order: { dueDate: 'asc' },
				pagination: { skip: paginationQuery.skip, limit: paginationQuery.limit },
			});

			expect(spyGetPermittedLessons).toHaveBeenCalledWith(currentUser.userId, [course]);

			spy.mockRestore();
			spyGetPermittedLessons.mockRestore();
			spygetPermittedCourses.mockRestore();
		});

		it('should return well formed task with course and status', async () => {
			const course = courseFactory.buildWithId();
			const task = taskFactory.draft(false).buildWithId({ course });

			const mockRestore = mockAll([task]);

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);
			expect(result[0]).toEqual({
				task,
				status: { submitted: 0, maxSubmissions: 1, graded: 0, isDraft: false, isSubstitutionTeacher: false },
			});
			expect(result[0].task.course).toBeDefined();

			mockRestore();
		});

		it('should find a list of tasks', async () => {
			const course = courseFactory.buildWithId();
			const task1 = taskFactory.draft(false).buildWithId({ course });
			const task2 = taskFactory.draft(false).buildWithId({ course });
			const task3 = taskFactory.draft(false).buildWithId({ course });

			const mockRestore = mockAll([task1, task2, task3]);

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAll(currentUser, paginationQuery);
			expect(count).toEqual(3);
			expect(result.length).toEqual(3);

			mockRestore();
		});

		it('should compute submitted status for task', async () => {
			const student = userFactory.buildWithId();
			student.id = currentUser.userId;
			const course = courseFactory.buildWithId();
			const task = taskFactory.draft(false).buildWithId({ course });
			task.submissions.add(submissionFactory.buildWithId({ task, student }));

			const mockRestore = mockAll([task]);

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 0,
				submitted: 1,
				maxSubmissions: 1,
				isDraft: false,
				isSubstitutionTeacher: false,
			});

			mockRestore();
		});

		it('should only count the submissions of the given user', async () => {
			const student1 = userFactory.buildWithId(undefined, currentUser.userId);
			const student2 = userFactory.buildWithId();
			const course = courseFactory.buildWithId();
			const task = taskFactory.draft(false).buildWithId({ course });
			task.submissions.add(submissionFactory.buildWithId({ task, student: student1 }));
			task.submissions.add(submissionFactory.buildWithId({ task, student: student2 }));

			const mockRestore = mockAll([task]);

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 0,
				submitted: 1,
				maxSubmissions: 1,
				isDraft: false,
				isSubstitutionTeacher: false,
			});

			mockRestore();
		});

		it('should compute graded status for task', async () => {
			const student = userFactory.buildWithId(undefined, currentUser.userId);
			const course = courseFactory.buildWithId();
			const task = taskFactory.draft(false).buildWithId({ course });
			const submission = submissionFactory.buildWithId({ task, student });
			task.submissions.add(submission);

			const spyGraded = jest.spyOn(submission, 'isGraded').mockImplementation(() => true);
			const mockRestore = mockAll([task]);

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(spyGraded).toBeCalled();
			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 1,
				submitted: 1,
				maxSubmissions: 1,
				isDraft: false,
				isSubstitutionTeacher: false,
			});

			mockRestore();
			spyGraded.mockRestore();
		});

		it('should only count the graded submissions of the given user', async () => {
			const student1 = userFactory.buildWithId(undefined, currentUser.userId);
			const student2 = userFactory.buildWithId();
			const course = courseFactory.buildWithId();
			const task = taskFactory.draft(false).buildWithId({ course });
			const submission1 = submissionFactory.buildWithId({ task, student: student1 });
			const submission2 = submissionFactory.buildWithId({ task, student: student2 });
			task.submissions.add(submission1, submission2);

			jest.spyOn(submission1, 'isGraded').mockImplementation(() => true);
			jest.spyOn(submission2, 'isGraded').mockImplementation(() => true);
			const mockRestore = mockAll([task]);

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 1,
				submitted: 1,
				maxSubmissions: 1,
				isDraft: false,
				isSubstitutionTeacher: false,
			});

			mockRestore();
		});
	});

	describe('as a teacher', () => {
		let currentUser: ICurrentUser;

		const mockAll = (tasks?: Task[], lessons?: Lesson[], courses?: Course[]) => {
			const spy1 = setTaskRepoMock.findAllByParentIds(tasks);
			const spy2 = setAuthorizationServiceMock.getPermittedLessons(lessons);
			const spy3 = setAuthorizationServiceMock.getPermittedCourses(courses);

			const mockRestore = () => {
				spy1.mockRestore();
				spy2.mockRestore();
				spy3.mockRestore();
			};

			return mockRestore;
		};

		beforeEach(() => {
			const permissions = [TaskDashBoardPermission.teacherDashboard];
			({ currentUser } = createCurrentTestUser(permissions));
		});

		it('should get parent ids for teacher role', async () => {
			const mockRestore = mockAll();
			const spy = setAuthorizationServiceMock.getPermittedCourses([]);

			const paginationQuery = new PaginationQuery();
			await service.findAll(currentUser, paginationQuery);

			const expectedParams = [currentUser.userId, TaskParentPermission.write];
			expect(spy).toHaveBeenCalledWith(...expectedParams);

			mockRestore();
			spy.mockRestore();
		});

		it('should return a counted result', async () => {
			const mockRestore = mockAll();

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAll(currentUser, paginationQuery);
			expect(Array.isArray(result)).toBeTruthy();
			expect(count).toEqual(0);

			mockRestore();
		});

		it('should find all tasks by permitted parent ids ordered by newest first', async () => {
			const course = courseFactory.buildWithId();
			const lesson = lessonFactory.buildWithId({ course, hidden: false });
			const tasks = [];
			const mockRestore = mockAll(tasks, [lesson], [course]);
			const spy = setTaskRepoMock.findAllByParentIds(tasks);

			const paginationQuery = new PaginationQuery();
			await service.findAll(currentUser, paginationQuery);

			const closed = { userId: currentUser.userId, value: false };
			const expectedParams = [
				{ creatorId: currentUser.userId, courseIds: [course.id], lessonIds: [lesson.id] },
				{ closed },
				{ order: { dueDate: 'desc' }, pagination: { skip: paginationQuery.skip, limit: paginationQuery.limit } },
			];

			expect(spy).toHaveBeenCalledWith(...expectedParams);

			mockRestore();
		});

		it('should return well formed task with course and status', async () => {
			const course = courseFactory.buildWithId();
			const task = taskFactory.buildWithId({ course });

			const mockRestore = mockAll([task]);

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);
			expect(result[0]).toEqual({
				task,
				status: {
					submitted: 0,
					maxSubmissions: course.getNumberOfStudents(),
					graded: 0,
					isDraft: true,
					isSubstitutionTeacher: false,
				},
			});
			expect(result[0].task.course).toBeDefined();

			mockRestore();
		});

		it('should mark substitution teacher in status', async () => {
			const perm = [TaskDashBoardPermission.teacherDashboard];
			const userData = createCurrentTestUser(perm);
			const course = courseFactory.buildWithId({ substitutionTeachers: [userData.user] });
			const task = new Task({ name: 'task #1', private: false, course });

			const mockRestore = mockAll([task]);

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(userData.currentUser, paginationQuery);
			expect(result[0].status.isSubstitutionTeacher).toBe(true);

			mockRestore();
		});

		it('should find a list of tasks', async () => {
			const course = courseFactory.buildWithId();
			const task1 = taskFactory.draft(false).buildWithId({ course });
			const task2 = taskFactory.draft(false).buildWithId({ course });
			const task3 = taskFactory.draft(false).buildWithId({ course });

			const mockRestore = mockAll([task1, task2, task3]);

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAll(currentUser, paginationQuery);
			expect(count).toEqual(3);
			expect(result.length).toEqual(3);

			mockRestore();
		});

		it('should compute submitted status for task', async () => {
			const student = userFactory.buildWithId();
			const course = courseFactory.buildWithId();
			const task = taskFactory.draft(false).buildWithId({ course });
			task.submissions.add(submissionFactory.buildWithId({ task, student }));

			const mockRestore = mockAll([task]);

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 0,
				submitted: 1,
				maxSubmissions: course.getNumberOfStudents(),
				isDraft: false,
				isSubstitutionTeacher: false,
			});

			mockRestore();
		});

		it('should count all student ids of submissions', async () => {
			const student1 = userFactory.buildWithId();
			const student2 = userFactory.buildWithId();
			const course = courseFactory.buildWithId();
			const task = taskFactory.draft(false).buildWithId({ course });
			const submission1 = submissionFactory.buildWithId({ task, student: student1 });
			const submission2 = submissionFactory.buildWithId({ task, student: student2 });
			task.submissions.add(submission1, submission2);

			const mockRestore = mockAll([task]);

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 0,
				submitted: 2,
				maxSubmissions: course.getNumberOfStudents(),
				isDraft: false,
				isSubstitutionTeacher: false,
			});

			mockRestore();
		});

		it('should compute graded status for task', async () => {
			const student = userFactory.buildWithId();
			const course = courseFactory.buildWithId();
			const task = taskFactory.draft(false).buildWithId({ course });
			const submission = submissionFactory.buildWithId({ task, student });
			task.submissions.add(submission);

			const spyGraded = jest.spyOn(submission, 'isGraded').mockImplementation(() => true);
			const mockRestore = mockAll([task]);

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(spyGraded).toBeCalled();
			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 1,
				submitted: 1,
				maxSubmissions: course.getNumberOfStudents(),
				isDraft: false,
				isSubstitutionTeacher: false,
			});

			mockRestore();
			spyGraded.mockRestore();
		});

		it('should count all student ids of graded submissions', async () => {
			const student1 = userFactory.buildWithId(undefined, currentUser.userId);
			const student2 = userFactory.buildWithId();
			const course = courseFactory.buildWithId();
			const task = taskFactory.draft(false).buildWithId({ course });
			const submission1 = submissionFactory.buildWithId({ task, student: student1 });
			const submission2 = submissionFactory.buildWithId({ task, student: student2 });
			task.submissions.add(submission1, submission2);

			jest.spyOn(submission1, 'isGraded').mockImplementation(() => true);
			jest.spyOn(submission2, 'isGraded').mockImplementation(() => true);
			const mockRestore = mockAll([task]);

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 2,
				submitted: 2,
				maxSubmissions: course.getNumberOfStudents(),
				isDraft: false,
				isSubstitutionTeacher: false,
			});

			mockRestore();
		});

		it('should count only unique student ids of graded submissions', async () => {
			const student1 = userFactory.buildWithId(undefined, currentUser.userId);
			const student2 = userFactory.buildWithId();
			const course = courseFactory.buildWithId();
			const task = taskFactory.draft(false).buildWithId({ course });
			const submission1 = submissionFactory.buildWithId({ task, student: student1 });
			const submission2 = submissionFactory.buildWithId({ task, student: student2 });
			const submission3 = submissionFactory.buildWithId({ task, student: student2 });

			task.submissions.add(submission1, submission2, submission3);

			jest.spyOn(submission1, 'isGraded').mockImplementation(() => true);
			jest.spyOn(submission2, 'isGraded').mockImplementation(() => true);
			jest.spyOn(submission3, 'isGraded').mockImplementation(() => true);
			const mockRestore = mockAll([task]);

			const paginationQuery = new PaginationQuery();
			const [result, total] = await service.findAll(currentUser, paginationQuery);

			expect(total).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 2,
				submitted: 2,
				maxSubmissions: course.getNumberOfStudents(),
				isDraft: false,
				isSubstitutionTeacher: false,
			});

			mockRestore();
		});

		it('should count only unique student ids of submissions', async () => {
			const student1 = userFactory.buildWithId();
			const student2 = userFactory.buildWithId();
			const course = courseFactory.buildWithId();
			const task = taskFactory.draft(false).buildWithId({ course });
			const submission1 = submissionFactory.buildWithId({ task, student: student1 });
			const submission2 = submissionFactory.buildWithId({ task, student: student1 });
			const submission3 = submissionFactory.buildWithId({ task, student: student2 });

			task.submissions.add(submission1, submission2, submission3);

			const mockRestore = mockAll([task]);

			const paginationQuery = new PaginationQuery();
			const [result, total] = await service.findAll(currentUser, paginationQuery);

			expect(total).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 0,
				submitted: 2,
				maxSubmissions: course.getNumberOfStudents(),
				isDraft: false,
				isSubstitutionTeacher: false,
			});

			mockRestore();
		});
	});
});
