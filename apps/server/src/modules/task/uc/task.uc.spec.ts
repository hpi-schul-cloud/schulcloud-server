import { Test, TestingModule } from '@nestjs/testing';

import { createCurrentTestUser } from '@src/modules/user/utils';
import { PaginationQuery } from '@shared/controller';
import { Course } from '@src/entities';

import { EntityId, ICurrentUser } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { Collection } from '@mikro-orm/core';
import { Submission, Task, UserTaskInfo } from '../entity';

import { TaskRepo } from '../repo';

import { TaskUC, TaskDashBoardPermission } from './task.uc';
import { TaskAuthorizationService, TaskParentPermission } from './task.authorization.service';

// TODO: coursegroups test completly missing
// TODO: how work this stuff with lessons
// TODO: how work this stuff with ignoredTask

describe('TaskService', () => {
	let service: TaskUC;
	let taskRepo: TaskRepo;
	let authorizationService: TaskAuthorizationService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TaskUC,
				{
					provide: TaskRepo,
					useValue: {
						findAll() {
							throw new Error('Please write a mock for TaskRepo.findAll');
						},
						findAllCurrent() {
							throw new Error('Please write a mock for TaskRepo.findAllCurrent');
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
		authorizationService = module.get(TaskAuthorizationService);
	});

	const setTaskRepoMock = {
		findAllCurrent: (data: Task[] = []) => {
			const spy = jest.spyOn(taskRepo, 'findAllCurrent').mockImplementation(() => {
				return Promise.resolve([data, data.length]);
			});
			return spy;
		},
		findAll: (data: Task[] = []) => {
			const spy = jest.spyOn(taskRepo, 'findAll').mockImplementation(() => {
				return Promise.resolve([data, data.length]);
			});
			return spy;
		},
	};

	const setAuthorizationServiceMock = {
		getPermittedCourses: (data: EntityId[] = []) => {
			const spy = jest.spyOn(authorizationService, 'getPermittedCourses').mockImplementation(() => {
				return Promise.resolve(data);
			});
			return spy;
		},
	};

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('findAll', () => {
		const findAllMock = () => {
			const spy1 = setTaskRepoMock.findAll();
			const spy2 = setTaskRepoMock.findAllCurrent();
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

		beforeEach(() => {
			const permissions = [TaskDashBoardPermission.studentDashboard];
			({ currentUser } = createCurrentTestUser(permissions));
		});

		it('should get parent ids for student role', async () => {
			const spyTaskRepoFindAll = setTaskRepoMock.findAll([]);
			const spyTaskRepoFindAllCurrent = setTaskRepoMock.findAllCurrent([]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses([]);

			const paginationQuery = new PaginationQuery();
			await service.findAll(currentUser, paginationQuery);

			const expectedParams = [currentUser.userId, TaskParentPermission.read];
			expect(spyGetPermittedCourses).toHaveBeenCalledWith(...expectedParams);

			spyTaskRepoFindAll.mockRestore();
			spyTaskRepoFindAllCurrent.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should return a counted result', async () => {
			const spyTaskRepoFindAll = setTaskRepoMock.findAll([]);
			const spyTaskRepoFindAllCurrent = setTaskRepoMock.findAllCurrent([]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses([]);

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAll(currentUser, paginationQuery);
			expect(Array.isArray(result)).toBeTruthy();
			expect(count).toEqual(0);

			spyTaskRepoFindAll.mockRestore();
			spyTaskRepoFindAllCurrent.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should find current tasks by permitted parent ids ordered by dueDate', async () => {
			const spyTaskRepoFindAllCurrent = setTaskRepoMock.findAllCurrent([]);
			const parentIds = [new ObjectId().toHexString(), new ObjectId().toHexString(), new ObjectId().toHexString()];
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses(parentIds);

			const paginationQuery = new PaginationQuery();
			await service.findAll(currentUser, paginationQuery);

			const expectedParams = [
				parentIds,
				{ order: { dueDate: 'asc' }, pagination: { skip: paginationQuery.skip, limit: paginationQuery.limit } },
			];
			expect(spyTaskRepoFindAllCurrent).toHaveBeenCalledWith(...expectedParams);

			spyTaskRepoFindAllCurrent.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should return well formed task with parent and status', async () => {
			const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
			const task = new Task({ name: 'task #1', private: false, parent: course });

			const spyTaskRepoFindAllCurrent = setTaskRepoMock.findAllCurrent([task]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);
			expect(result[0]).toEqual({ task, status: { submitted: 0, maxSubmissions: 1, graded: 0 } });
			expect(result[0].task.parent).toBeDefined();

			spyTaskRepoFindAllCurrent.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should find a list of tasks', async () => {
			const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
			const task1 = new Task({ name: 'task #1', private: false, parent: course });
			const task2 = new Task({ name: 'task #2', private: false, parent: course });
			const task3 = new Task({ name: 'task #2', private: false, parent: course });

			const spyTaskRepoFindAllCurrent = setTaskRepoMock.findAllCurrent([task1, task2, task3]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAll(currentUser, paginationQuery);
			expect(count).toEqual(3);
			expect(result.length).toEqual(3);

			spyTaskRepoFindAllCurrent.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should compute submitted status for task', async () => {
			const student = new UserTaskInfo({ firstName: 'John', lastName: 'Doe' });
			student.id = currentUser.userId;
			const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
			const task = new Task({ name: 'task #1', private: false, parent: course });
			const submission = new Submission({ task, student, comment: 'my solution to the task #1' });
			task.submissions = new Collection<Submission>(task, [submission]);

			const spyTaskRepoFindAllCurrent = setTaskRepoMock.findAllCurrent([task]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 0,
				submitted: 1,
				maxSubmissions: 1,
			});

			spyTaskRepoFindAllCurrent.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});
		it('should only count the submissions of the given user', async () => {
			const student1 = new UserTaskInfo({ firstName: 'John', lastName: 'Doe' });
			student1.id = currentUser.userId;
			const student2 = new UserTaskInfo({ firstName: 'Marla', lastName: 'Mathe' });
			student2.id = new ObjectId().toHexString();
			const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
			const task = new Task({ name: 'task #1', private: false, parent: course });
			const submission1 = new Submission({ task, student: student1, comment: 'submission #1' });
			const submission2 = new Submission({ task, student: student2, comment: 'submission #2' });
			task.submissions = new Collection<Submission>(task, [submission1, submission2]);

			const spyTaskRepoFindAllCurrent = setTaskRepoMock.findAllCurrent([task]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 0,
				submitted: 1,
				maxSubmissions: 1,
			});

			spyTaskRepoFindAllCurrent.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should compute graded status for task', async () => {
			const student = new UserTaskInfo({ firstName: 'John', lastName: 'Doe' });
			student.id = currentUser.userId;
			const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
			const task = new Task({ name: 'task #1', private: false, parent: course });
			const submission = new Submission({ task, student, comment: 'my solution to the task #1' });
			task.submissions = new Collection<Submission>(task, [submission]);

			const spyGraded = jest.spyOn(submission, 'isGraded').mockImplementation(() => true);
			const spyTaskRepoFindAllCurrent = setTaskRepoMock.findAllCurrent([task]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(spyGraded).toBeCalled();
			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 1,
				submitted: 1,
				maxSubmissions: 1,
			});

			spyTaskRepoFindAllCurrent.mockRestore();
			spyGetPermittedCourses.mockRestore();
			spyGraded.mockRestore();
		});

		it('should only count the graded submissions of the given user', async () => {
			const student1 = new UserTaskInfo({ firstName: 'John', lastName: 'Doe' });
			student1.id = currentUser.userId;
			const student2 = new UserTaskInfo({ firstName: 'Marla', lastName: 'Mathe' });
			student2.id = new ObjectId().toHexString();
			const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
			const task = new Task({ name: 'task #1', private: false, parent: course });
			const submission1 = new Submission({ task, student: student1, comment: 'submission #1' });
			const submission2 = new Submission({ task, student: student2, comment: 'submission #2' });
			task.submissions = new Collection<Submission>(task, [submission1, submission2]);

			jest.spyOn(submission1, 'isGraded').mockImplementation(() => true);
			jest.spyOn(submission2, 'isGraded').mockImplementation(() => true);
			const spyTaskRepoFindAllCurrent = setTaskRepoMock.findAllCurrent([task]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 1,
				submitted: 1,
				maxSubmissions: 1,
			});

			spyTaskRepoFindAllCurrent.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});
	});

	describe('as a teacher', () => {
		let currentUser: ICurrentUser;

		beforeEach(() => {
			const permissions = [TaskDashBoardPermission.teacherDashboard];
			({ currentUser } = createCurrentTestUser(permissions));
		});

		it('should get parent ids for teacher role', async () => {
			const spyTaskRepoFindAll = setTaskRepoMock.findAll([]);
			const spyTaskRepoFindAllCurrent = setTaskRepoMock.findAllCurrent([]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses([]);

			const paginationQuery = new PaginationQuery();
			await service.findAll(currentUser, paginationQuery);

			const expectedParams = [currentUser.userId, TaskParentPermission.write];
			expect(spyGetPermittedCourses).toHaveBeenCalledWith(...expectedParams);

			spyTaskRepoFindAll.mockRestore();
			spyTaskRepoFindAllCurrent.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should return a counted result', async () => {
			const spyTaskRepoFindAll = setTaskRepoMock.findAll([]);
			const spyTaskRepoFindAllCurrent = setTaskRepoMock.findAllCurrent([]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses([]);

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAll(currentUser, paginationQuery);
			expect(Array.isArray(result)).toBeTruthy();
			expect(count).toEqual(0);

			spyTaskRepoFindAll.mockRestore();
			spyTaskRepoFindAllCurrent.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should find all tasks by permitted parent ids ordered by newest first', async () => {
			const spyTaskRepoFindAll = setTaskRepoMock.findAll([]);
			const parentIds = [new ObjectId().toHexString(), new ObjectId().toHexString(), new ObjectId().toHexString()];
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses(parentIds);

			const paginationQuery = new PaginationQuery();
			await service.findAll(currentUser, paginationQuery);

			const expectedParams = [
				parentIds,
				{ order: { createdAt: 'desc' }, pagination: { skip: paginationQuery.skip, limit: paginationQuery.limit } },
			];
			expect(spyTaskRepoFindAll).toHaveBeenCalledWith(...expectedParams);

			spyTaskRepoFindAll.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should return well formed task with parent and status', async () => {
			const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
			const task = new Task({ name: 'task #1', private: false, parent: course });

			const spyTaskRepoFindAll = setTaskRepoMock.findAll([task]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);
			expect(result[0]).toEqual({
				task,
				status: { submitted: 0, maxSubmissions: course.getNumberOfStudents(), graded: 0 },
			});
			expect(result[0].task.parent).toBeDefined();

			spyTaskRepoFindAll.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should find a list of tasks', async () => {
			const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
			const task1 = new Task({ name: 'task #1', private: false, parent: course });
			const task2 = new Task({ name: 'task #2', private: false, parent: course });
			const task3 = new Task({ name: 'task #2', private: false, parent: course });

			const spyTaskRepoFindAll = setTaskRepoMock.findAll([task1, task2, task3]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAll(currentUser, paginationQuery);
			expect(count).toEqual(3);
			expect(result.length).toEqual(3);

			spyTaskRepoFindAll.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should compute submitted status for task', async () => {
			const student = new UserTaskInfo({ firstName: 'John', lastName: 'Doe' });
			student.id = new ObjectId().toHexString();
			const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
			const task = new Task({ name: 'task #1', private: false, parent: course });
			const submission = new Submission({ task, student, comment: 'my solution to the task #1' });
			task.submissions = new Collection<Submission>(task, [submission]);

			const spyTaskRepoFindAll = setTaskRepoMock.findAll([task]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 0,
				submitted: 1,
				maxSubmissions: course.getNumberOfStudents(),
			});

			spyTaskRepoFindAll.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should count all student ids of submissions', async () => {
			const student1 = new UserTaskInfo({ firstName: 'John', lastName: 'Doe' });
			student1.id = new ObjectId().toHexString();
			const student2 = new UserTaskInfo({ firstName: 'Marla', lastName: 'Mathe' });
			student2.id = new ObjectId().toHexString();
			const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
			const task = new Task({ name: 'task #1', private: false, parent: course });
			const submission1 = new Submission({ task, student: student1, comment: 'submission #1' });
			const submission2 = new Submission({ task, student: student2, comment: 'submission #2' });
			task.submissions = new Collection<Submission>(task, [submission1, submission2]);

			const spyTaskRepoFindAll = setTaskRepoMock.findAll([task]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 0,
				submitted: 2,
				maxSubmissions: course.getNumberOfStudents(),
			});

			spyTaskRepoFindAll.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should compute graded status for task', async () => {
			const student = new UserTaskInfo({ firstName: 'John', lastName: 'Doe' });
			student.id = new ObjectId().toHexString();
			const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
			const task = new Task({ name: 'task #1', private: false, parent: course });
			const submission = new Submission({ task, student, comment: 'my solution to the task #1' });
			task.submissions = new Collection<Submission>(task, [submission]);

			const spyGraded = jest.spyOn(submission, 'isGraded').mockImplementation(() => true);
			const spyTaskRepoFindAll = setTaskRepoMock.findAll([task]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(spyGraded).toBeCalled();
			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 1,
				submitted: 1,
				maxSubmissions: course.getNumberOfStudents(),
			});

			spyTaskRepoFindAll.mockRestore();
			spyGetPermittedCourses.mockRestore();
			spyGraded.mockRestore();
		});

		it('should count all student ids of graded submissions', async () => {
			const student1 = new UserTaskInfo({ firstName: 'John', lastName: 'Doe' });
			student1.id = currentUser.userId;
			const student2 = new UserTaskInfo({ firstName: 'Marla', lastName: 'Mathe' });
			student2.id = new ObjectId().toHexString();
			const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
			const task = new Task({ name: 'task #1', private: false, parent: course });
			const submission1 = new Submission({ task, student: student1, comment: 'submission #1' });
			const submission2 = new Submission({ task, student: student2, comment: 'submission #2' });
			task.submissions = new Collection<Submission>(task, [submission1, submission2]);

			jest.spyOn(submission1, 'isGraded').mockImplementation(() => true);
			jest.spyOn(submission2, 'isGraded').mockImplementation(() => true);
			const spyTaskRepoFindAll = setTaskRepoMock.findAll([task]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 2,
				submitted: 2,
				maxSubmissions: course.getNumberOfStudents(),
			});

			spyTaskRepoFindAll.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should count only unique student ids of graded submissions', async () => {
			const student1 = new UserTaskInfo({ firstName: 'John', lastName: 'Doe' });
			student1.id = currentUser.userId;
			const student2 = new UserTaskInfo({ firstName: 'Marla', lastName: 'Mathe' });
			student2.id = new ObjectId().toHexString();
			const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
			const task = new Task({ name: 'task #1', private: false, parent: course });
			const submission1 = new Submission({ task, student: student1, comment: 'submission #1' });
			const submission2 = new Submission({ task, student: student2, comment: 'submission #2' });
			const submission3 = new Submission({ task, student: student2, comment: 'submission #3' });
			task.submissions = new Collection<Submission>(task, [submission1, submission2, submission3]);

			jest.spyOn(submission1, 'isGraded').mockImplementation(() => true);
			jest.spyOn(submission2, 'isGraded').mockImplementation(() => true);
			jest.spyOn(submission3, 'isGraded').mockImplementation(() => true);
			const spyTaskRepoFindAll = setTaskRepoMock.findAll([task]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 2,
				submitted: 2,
				maxSubmissions: course.getNumberOfStudents(),
			});

			spyTaskRepoFindAll.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should count only unique student ids of submissions', async () => {
			const student1 = new UserTaskInfo({ firstName: 'John', lastName: 'Doe' });
			student1.id = new ObjectId().toHexString();
			const student2 = new UserTaskInfo({ firstName: 'Marla', lastName: 'Mathe' });
			student2.id = new ObjectId().toHexString();
			const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
			const task = new Task({ name: 'task #1', private: false, parent: course });
			const submission1 = new Submission({ task, student: student1, comment: 'submission #1' });
			const submission2 = new Submission({ task, student: student1, comment: 'submission #2' });
			const submission3 = new Submission({ task, student: student2, comment: 'submission #2' });
			task.submissions = new Collection<Submission>(task, [submission1, submission2, submission3]);

			const spyTaskRepoFindAll = setTaskRepoMock.findAll([task]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 0,
				submitted: 2,
				maxSubmissions: course.getNumberOfStudents(),
			});

			spyTaskRepoFindAll.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});
	});
});
