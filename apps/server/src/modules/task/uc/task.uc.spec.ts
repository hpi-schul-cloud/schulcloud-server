import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from '@mikro-orm/mongodb';

import { PaginationQuery } from '@shared/controller';
import { EntityId, ICurrentUser, Lesson, Task } from '@shared/domain';
import {
	userFactory,
	courseFactory,
	lessonFactory,
	taskFactory,
	submissionFactory,
	createCurrentTestUser,
} from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@src/modules/database';
import { LessonRepo } from '@shared/repo';
import { TaskRepo } from '../repo';
import { TaskUC, TaskDashBoardPermission } from './task.uc';
import { TaskAuthorizationService, TaskParentPermission } from './task.authorization.service';

// TODO: add courseGroups tests
// TODO: what about ignoredTask?

describe('TaskUC', () => {
	let module: TestingModule;
	let service: TaskUC;
	let taskRepo: TaskRepo;
	let lessonRepo: LessonRepo;
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
					provide: LessonRepo,
					useValue: {
						findAllByCourseIds() {
							throw new Error('Please write a mock for LessonRepo.findAllByCourseIds');
						},
					},
				},
				{
					provide: TaskAuthorizationService,
					useValue: {
						getPermittedCourses() {
							throw new Error('Please write a mock for TaskAuthorizationService.getPermittedCourses');
						},
					},
				},
			],
		}).compile();

		service = module.get(TaskUC);
		taskRepo = module.get(TaskRepo);
		lessonRepo = module.get(LessonRepo);
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

	const setLessonRepoMock = {
		findAllByCourseIds: (lessons: Lesson[] = []) => {
			const spy = jest.spyOn(lessonRepo, 'findAllByCourseIds').mockImplementation(() => {
				return Promise.resolve(lessons);
			});
			return spy;
		},
	};

	const setAuthorizationServiceMock = {
		// TODO: course instant of courseIds
		getPermittedCourses: (courseIds: EntityId[] = []) => {
			const spy = jest.spyOn(authorizationService, 'getPermittedCourses').mockImplementation(() => {
				return Promise.resolve(courseIds);
			});
			return spy;
		},
	};

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('findAll', () => {
		const findAllMock = () => {
			const spy1 = setTaskRepoMock.findAllByParentIds();
			const spy2 = setLessonRepoMock.findAllByCourseIds();
			const spy3 = setAuthorizationServiceMock.getPermittedCourses();

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

		const mockAll = (tasks?, lessons?, courseIds?) => {
			const spy1 = setTaskRepoMock.findAllByParentIds(tasks);
			const spy2 = setLessonRepoMock.findAllByCourseIds(lessons);
			const spy3 = setAuthorizationServiceMock.getPermittedCourses(courseIds);

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
			const course = courseFactory.build();
			const lesson = lessonFactory.build({ course, hidden: false });
			Object.assign(lesson, { _id: new ObjectId() });
			const spyLessonRepoFindAllByCourseIds = setLessonRepoMock.findAllByCourseIds([lesson]);
			const parentIds = [new ObjectId().toHexString(), new ObjectId().toHexString(), new ObjectId().toHexString()];
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses(parentIds);

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

			expect(spyLessonRepoFindAllByCourseIds).toHaveBeenCalledWith(parentIds, { hidden: false });

			spy.mockRestore();
			spyLessonRepoFindAllByCourseIds.mockRestore();
			spyGetPermittedCourses.mockRestore();
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

		const mockAll = (tasks?, lessons?, courseIds?) => {
			const spy1 = setTaskRepoMock.findAllByParentIds(tasks);
			const spy2 = setLessonRepoMock.findAllByCourseIds(lessons);
			const spy3 = setAuthorizationServiceMock.getPermittedCourses(courseIds);

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
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses([]);

			const paginationQuery = new PaginationQuery();
			await service.findAll(currentUser, paginationQuery);

			const expectedParams = [currentUser.userId, TaskParentPermission.write];
			expect(spyGetPermittedCourses).toHaveBeenCalledWith(...expectedParams);

			mockRestore();
			spyGetPermittedCourses.mockRestore();
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
			const mockRestore = mockAll(tasks, [lesson], parentIds);
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

			const spyTaskRepoFindAllByParentIds = setTaskRepoMock.findAllByParentIds([task]);
			const spyLessonRepoFindAllByCourseIds = setLessonRepoMock.findAllByCourseIds([]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(userData.currentUser, paginationQuery);
			expect(result[0].status.isSubstitutionTeacher).toBe(true);

			spyTaskRepoFindAllByParentIds.mockRestore();
			spyLessonRepoFindAllByCourseIds.mockRestore();
			spyGetPermittedCourses.mockRestore();
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
