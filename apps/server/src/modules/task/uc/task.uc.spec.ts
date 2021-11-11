import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from '@mikro-orm/mongodb';

import { PaginationQuery } from '@shared/controller';
import { EntityId, ICurrentUser, Task } from '@shared/domain';
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
					},
				},
				{
					provide: TaskAuthorizationService,
					useValue: {
						getPermittedCourseIds() {
							throw new Error('Please write a mock for TaskAuthorizationService.getPermittedCoursesIds');
						},
						getPermittedLessonIds() {
							throw new Error('Please write a mock for TaskAuthorizationService.getPermittedLessonsIds');
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
			const spy = jest.spyOn(taskRepo, 'findAllByParentIds').mockImplementation(() => {
				return Promise.resolve([tasks, tasks.length]);
			});
			return spy;
		},
	};

	const setAuthorizationServiceMock = {
		// TODO: course instant of courseIds
		getPermittedCourseIds: (courseIds: EntityId[] = []) => {
			const spy = jest.spyOn(authorizationService, 'getPermittedCourseIds').mockImplementation(() => {
				return Promise.resolve(courseIds);
			});
			return spy;
		},
		getPermittedLessonIds: (lessonIds: EntityId[] = []) => {
			const spy = jest.spyOn(authorizationService, 'getPermittedLessonIds').mockImplementation(() => {
				return Promise.resolve(lessonIds);
			});
			return spy;
		},
	};

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('findAllFinished', () => {
		const findAllMock = (tasks?: Task[], lessonIds?: EntityId[], courseIds?: EntityId[]) => {
			const spy1 = setTaskRepoMock.findAllByParentIds(tasks);
			const spy2 = setAuthorizationServiceMock.getPermittedCourseIds(courseIds);
			const spy3 = setAuthorizationServiceMock.getPermittedLessonIds(lessonIds);

			const mockRestore = () => {
				spy1.mockRestore();
				spy2.mockRestore();
				spy3.mockRestore();
			};

			return mockRestore;
		};

		const createUser = () => {
			const user = userFactory.build();
			Object.assign(user, { _id: new ObjectId() });
			return user;
		};

		it('should return task for a user', async () => {
			const user = createUser();
			const task = taskFactory.finished(user).build();
			const mockRestore = findAllMock([task]);

			const [, total] = await service.findAllFinished(user.id);

			expect(total).toEqual(1);

			mockRestore();
		});

		it('should call task repo findAllByParentIds', async () => {
			const user = createUser();
			const mockRestore = findAllMock();
			const spy = setTaskRepoMock.findAllByParentIds();

			await service.findAllFinished(user.id);

			expect(spy).toHaveBeenCalled();

			mockRestore();
		});

		it('should call task repo findAllByParentIds for finished tasks', async () => {
			const user = createUser();
			const mockRestore = findAllMock();
			const spy = setTaskRepoMock.findAllByParentIds();

			await service.findAllFinished(user.id);

			const expectedParams = [{ courseIds: [], lessonIds: [] }, { closed: user.id }, { pagination: undefined }];
			expect(spy).toHaveBeenCalledWith(...expectedParams);

			mockRestore();
		});

		it('should call authorization service getPermittedCourseIds', async () => {
			const user = createUser();
			const mockRestore = findAllMock();
			const spy = setAuthorizationServiceMock.getPermittedCourseIds();

			await service.findAllFinished(user.id);

			expect(spy).toHaveBeenCalled();

			mockRestore();
		});

		it('should call authorization service getPermittedLessonIds', async () => {
			const user = createUser();
			const mockRestore = findAllMock();
			const spy = setAuthorizationServiceMock.getPermittedCourseIds();

			await service.findAllFinished(user.id);

			expect(spy).toHaveBeenCalled();

			mockRestore();
		});

		it('should return a counted type', async () => {
			const user = createUser();
			const task = taskFactory.finished(user).build();
			const mockRestore = findAllMock([task]);

			const result = await service.findAllFinished(user.id);

			expect(result).toEqual([[task], 1]);

			mockRestore();
		});

		it('should pass skip option', async () => {
			const user = createUser();
			const mockRestore = findAllMock();
			const spy = setTaskRepoMock.findAllByParentIds();
			const skip = 5;

			await service.findAllFinished(user.id, { skip });

			const expectedParams = [{ courseIds: [], lessonIds: [] }, { closed: user.id }, { pagination: { skip: 5 } }];
			expect(spy).toHaveBeenCalledWith(...expectedParams);

			mockRestore();
		});

		it('should pass limit option', async () => {
			const user = createUser();
			const mockRestore = findAllMock();
			const spy = setTaskRepoMock.findAllByParentIds();
			const limit = 5;

			await service.findAllFinished(user.id, { limit });

			const expectedParams = [{ courseIds: [], lessonIds: [] }, { closed: user.id }, { pagination: { limit: 5 } }];
			expect(spy).toHaveBeenCalledWith(...expectedParams);

			mockRestore();
		});

		it('should used permitted lessons for search finished tasks', async () => {
			const user = createUser();
			const lessonId = new ObjectId().toHexString();
			const mockRestore = findAllMock([], [lessonId]);
			const spy = setTaskRepoMock.findAllByParentIds();

			await service.findAllFinished(user.id);

			const expectedParams = [{ courseIds: [], lessonIds: [lessonId] }, { closed: user.id }, { pagination: undefined }];
			expect(spy).toHaveBeenCalledWith(...expectedParams);

			mockRestore();
		});

		it('should used permitted courses for search finished tasks', async () => {
			const user = createUser();
			const courseId = new ObjectId().toHexString();
			const mockRestore = findAllMock([], [], [courseId]);
			const spy = setTaskRepoMock.findAllByParentIds();

			await service.findAllFinished(user.id);

			const expectedParams = [{ courseIds: [courseId], lessonIds: [] }, { closed: user.id }, { pagination: undefined }];
			expect(spy).toHaveBeenCalledWith(...expectedParams);

			mockRestore();
		});
	});

	describe('findAll', () => {
		const findAllMock = () => {
			const spy1 = setTaskRepoMock.findAllByParentIds();
			const spy2 = setAuthorizationServiceMock.getPermittedCourseIds();
			const spy3 = setAuthorizationServiceMock.getPermittedLessonIds();

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

		const mockAll = (tasks?: Task[], lessons?: EntityId[], courseIds?: EntityId[]) => {
			const spy1 = setTaskRepoMock.findAllByParentIds(tasks);
			const spy2 = setAuthorizationServiceMock.getPermittedLessonIds(lessons);
			const spy3 = setAuthorizationServiceMock.getPermittedCourseIds(courseIds);

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
			const spy = setAuthorizationServiceMock.getPermittedCourseIds();

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
			const course = courseFactory.build();
			const lesson = lessonFactory.build({ course, hidden: false });
			Object.assign(lesson, { _id: new ObjectId() });

			const spyGetPermittedLessonIds = setAuthorizationServiceMock.getPermittedLessonIds([lesson.id]);
			const parentIds = [new ObjectId().toHexString(), new ObjectId().toHexString(), new ObjectId().toHexString()];
			const spyGetPermittedCourseIds = setAuthorizationServiceMock.getPermittedCourseIds(parentIds);

			const paginationQuery = new PaginationQuery();
			await service.findAll(currentUser, paginationQuery);

			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy.mock.calls[0][0]).toEqual({
				courseIds: parentIds,
				lessonIds: [lesson.id],
			});
			expect(spy.mock.calls[0][1]?.draft).toEqual(false);
			expect(spy.mock.calls[0][1]?.closed).toEqual(currentUser.userId);
			expect(spy.mock.calls[0][1]?.afterDueDateOrNone).toBeDefined();
			expect(spy.mock.calls[0][2]).toEqual({
				order: { dueDate: 'asc' },
				pagination: { skip: paginationQuery.skip, limit: paginationQuery.limit },
			});

			expect(spyGetPermittedLessonIds).toHaveBeenCalledWith(currentUser.userId, parentIds);

			spy.mockRestore();
			spyGetPermittedLessonIds.mockRestore();
			spyGetPermittedCourseIds.mockRestore();
		});

		it('should return well formed task with course and status', async () => {
			const course = courseFactory.build();
			const task = taskFactory.draft(false).build({ course });

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
			const course = courseFactory.build();
			const task1 = taskFactory.draft(false).build({ course });
			const task2 = taskFactory.draft(false).build({ course });
			const task3 = taskFactory.draft(false).build({ course });

			const mockRestore = mockAll([task1, task2, task3]);

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAll(currentUser, paginationQuery);
			expect(count).toEqual(3);
			expect(result.length).toEqual(3);

			mockRestore();
		});

		it('should compute submitted status for task', async () => {
			const student = userFactory.build();
			student.id = currentUser.userId;
			const course = courseFactory.build();
			const task = taskFactory.draft(false).build({ course });
			task.submissions.add(submissionFactory.build({ task, student }));

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
			const student1 = userFactory.build();
			student1.id = currentUser.userId;
			const student2 = userFactory.build();
			student2.id = new ObjectId().toHexString();
			const course = courseFactory.build();
			const task = taskFactory.draft(false).build({ course });
			task.submissions.add(submissionFactory.build({ task, student: student1 }));
			task.submissions.add(submissionFactory.build({ task, student: student2 }));

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
			const student = userFactory.build();
			student.id = currentUser.userId;
			const course = courseFactory.build();
			const task = taskFactory.draft(false).build({ course });
			const submission = submissionFactory.build({ task, student });
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
			const student1 = userFactory.build();
			student1.id = currentUser.userId;
			const student2 = userFactory.build();
			student2.id = new ObjectId().toHexString();
			const course = courseFactory.build();
			const task = taskFactory.draft(false).build({ course });
			const submission1 = submissionFactory.build({ task, student: student1 });
			const submission2 = submissionFactory.build({ task, student: student2 });
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

		const mockAll = (tasks?: Task[], lessonIds?: EntityId[], courseIds?: EntityId[]) => {
			const spy1 = setTaskRepoMock.findAllByParentIds(tasks);
			const spy2 = setAuthorizationServiceMock.getPermittedLessonIds(lessonIds);
			const spy3 = setAuthorizationServiceMock.getPermittedCourseIds(courseIds);

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
			const spy = setAuthorizationServiceMock.getPermittedCourseIds([]);

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
			const parentIds = [new ObjectId().toHexString(), new ObjectId().toHexString(), new ObjectId().toHexString()];
			const course = courseFactory.build();
			const lesson = lessonFactory.build({ course, hidden: false });
			Object.assign(lesson, { _id: new ObjectId() });
			const tasks = [];
			const mockRestore = mockAll(tasks, [lesson.id], parentIds);
			const spy = setTaskRepoMock.findAllByParentIds(tasks);

			const paginationQuery = new PaginationQuery();
			await service.findAll(currentUser, paginationQuery);

			const expectedParams = [
				{ teacherId: currentUser.userId, courseIds: parentIds, lessonIds: [lesson.id] },
				{ closed: currentUser.userId },
				{ order: { dueDate: 'desc' }, pagination: { skip: paginationQuery.skip, limit: paginationQuery.limit } },
			];

			expect(spy).toHaveBeenCalledWith(...expectedParams);

			mockRestore();
		});

		it('should return well formed task with course and status', async () => {
			const course = courseFactory.build();
			const task = taskFactory.build({ course });

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
			const course = courseFactory.build({ substitutionTeachers: [userData.user] });
			const task = new Task({ name: 'task #1', private: false, course });

			const mockRestore = mockAll([task]);

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(userData.currentUser, paginationQuery);
			expect(result[0].status.isSubstitutionTeacher).toBe(true);

			mockRestore();
		});

		it('should find a list of tasks', async () => {
			const course = courseFactory.build();
			const task1 = taskFactory.draft(false).build({ course });
			const task2 = taskFactory.draft(false).build({ course });
			const task3 = taskFactory.draft(false).build({ course });

			const mockRestore = mockAll([task1, task2, task3]);

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAll(currentUser, paginationQuery);
			expect(count).toEqual(3);
			expect(result.length).toEqual(3);

			mockRestore();
		});

		it('should compute submitted status for task', async () => {
			const student = userFactory.build();
			student.id = new ObjectId().toHexString();
			const course = courseFactory.build();
			const task = taskFactory.draft(false).build({ course });
			task.submissions.add(submissionFactory.build({ task, student }));

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
			const student1 = userFactory.build();
			student1.id = new ObjectId().toHexString();
			const student2 = userFactory.build();
			student2.id = new ObjectId().toHexString();
			const course = courseFactory.build();
			const task = taskFactory.draft(false).build({ course });
			const submission1 = submissionFactory.build({ task, student: student1 });
			const submission2 = submissionFactory.build({ task, student: student2 });
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
			const student = userFactory.build();
			student.id = new ObjectId().toHexString();
			const course = courseFactory.build();
			const task = taskFactory.draft(false).build({ course });
			const submission = submissionFactory.build({ task, student });
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
			const student1 = userFactory.build();
			student1.id = currentUser.userId;
			const student2 = userFactory.build();
			student2.id = new ObjectId().toHexString();
			const course = courseFactory.build();
			const task = taskFactory.draft(false).build({ course });
			const submission1 = submissionFactory.build({ task, student: student1 });
			const submission2 = submissionFactory.build({ task, student: student2 });
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
			const student1 = userFactory.build();
			student1.id = currentUser.userId;
			const student2 = userFactory.build();
			student2.id = new ObjectId().toHexString();
			const course = courseFactory.build();
			const task = taskFactory.draft(false).build({ course });
			const submission1 = submissionFactory.build({ task, student: student1 });
			const submission2 = submissionFactory.build({ task, student: student2 });
			const submission3 = submissionFactory.build({ task, student: student2 });

			task.submissions.add(submission1, submission2, submission3);

			jest.spyOn(submission1, 'isGraded').mockImplementation(() => true);
			jest.spyOn(submission2, 'isGraded').mockImplementation(() => true);
			jest.spyOn(submission3, 'isGraded').mockImplementation(() => true);
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

		it('should count only unique student ids of submissions', async () => {
			const student1 = userFactory.build();
			student1.id = new ObjectId().toHexString();
			const student2 = userFactory.build();
			student2.id = new ObjectId().toHexString();
			const course = courseFactory.build();
			const task = taskFactory.draft(false).build({ course });
			const submission1 = submissionFactory.build({ task, student: student1 });
			const submission2 = submissionFactory.build({ task, student: student1 });
			const submission3 = submissionFactory.build({ task, student: student2 });

			task.submissions.add(submission1, submission2, submission3);

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
	});
});
