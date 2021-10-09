import { Test, TestingModule } from '@nestjs/testing';

import { createCurrentTestUser } from '@src/modules/user/utils';
import { PaginationQuery } from '@shared/controller';

import { EntityId, ICurrentUser, Lesson, Submission, Task } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { Collection } from '@mikro-orm/core';

import { userFactory } from '@shared/domain/factory';
import { MongoMemoryDatabaseModule } from '@src/modules/database';
import { courseFactory } from '@shared/domain/factory/course.factory';
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
							throw new Error('Please write a mock for TaskRepo.findAll');
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
		findAllByParentIds: (data: Task[] = []) => {
			const spy = jest.spyOn(taskRepo, 'findAllByParentIds').mockImplementation(() => {
				return Promise.resolve([data, data.length]);
			});
			return spy;
		},
	};

	const setLessonRepoMock = {
		findAllByCourseIds: (data: Lesson[] = []) => {
			const spy = jest.spyOn(lessonRepo, 'findAllByCourseIds').mockImplementation(() => {
				return Promise.resolve(data);
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

		beforeEach(() => {
			const permissions = [TaskDashBoardPermission.studentDashboard];
			({ currentUser } = createCurrentTestUser(permissions));
		});

		it('should get parent ids for student role', async () => {
			const spyTaskRepoFindAllByParentIds = setTaskRepoMock.findAllByParentIds([]);
			const spyLessonRepoFindAllByCourseIds = setLessonRepoMock.findAllByCourseIds([]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses([]);

			const paginationQuery = new PaginationQuery();
			await service.findAll(currentUser, paginationQuery);

			const expectedParams = [currentUser.userId, TaskParentPermission.read];
			expect(spyGetPermittedCourses).toHaveBeenCalledWith(...expectedParams);

			spyTaskRepoFindAllByParentIds.mockRestore();
			spyLessonRepoFindAllByCourseIds.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should return a counted result', async () => {
			const spyTaskRepoFindAllByParentIds = setTaskRepoMock.findAllByParentIds([]);
			const spyLessonRepoFindAllByCourseIds = setLessonRepoMock.findAllByCourseIds([]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses([]);

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAll(currentUser, paginationQuery);
			expect(Array.isArray(result)).toBeTruthy();
			expect(count).toEqual(0);

			spyTaskRepoFindAllByParentIds.mockRestore();
			spyLessonRepoFindAllByCourseIds.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should find current tasks by permitted parent ids ordered by dueDate', async () => {
			const spyTaskRepoFindAllByParentIds = setTaskRepoMock.findAllByParentIds([]);
			const course = courseFactory.build();
			const lesson = new Lesson({ course, hidden: false });
			Object.assign(lesson, { _id: new ObjectId() });
			const spyLessonRepoFindAllByCourseIds = setLessonRepoMock.findAllByCourseIds([lesson]);
			const parentIds = [new ObjectId().toHexString(), new ObjectId().toHexString(), new ObjectId().toHexString()];
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses(parentIds);

			const paginationQuery = new PaginationQuery();
			await service.findAll(currentUser, paginationQuery);

			expect(spyTaskRepoFindAllByParentIds).toHaveBeenCalledTimes(1);
			expect(spyTaskRepoFindAllByParentIds.mock.calls[0][0]).toEqual({ courseIds: parentIds, lessonIds: [lesson.id] });
			expect(spyTaskRepoFindAllByParentIds.mock.calls[0][1]?.draft).toEqual(false);
			expect(spyTaskRepoFindAllByParentIds.mock.calls[0][1]?.afterDueDateOrNone).toBeDefined();
			expect(spyTaskRepoFindAllByParentIds.mock.calls[0][2]).toEqual({
				order: { dueDate: 'asc' },
				pagination: { skip: paginationQuery.skip, limit: paginationQuery.limit },
			});

			expect(spyLessonRepoFindAllByCourseIds).toHaveBeenCalledWith(parentIds, { hidden: false });

			spyTaskRepoFindAllByParentIds.mockRestore();
			spyLessonRepoFindAllByCourseIds.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should return well formed task with parent and status', async () => {
			const course = courseFactory.build();
			const task = new Task({ name: 'task #1', private: false, parent: course });

			const spyTaskRepoFindAllByParentIds = setTaskRepoMock.findAllByParentIds([task]);
			const spyLessonRepoFindAllByCourseIds = setLessonRepoMock.findAllByCourseIds([]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);
			expect(result[0]).toEqual({ task, status: { submitted: 0, maxSubmissions: 1, graded: 0, isDraft: false } });
			expect(result[0].task.parent).toBeDefined();

			spyTaskRepoFindAllByParentIds.mockRestore();
			spyLessonRepoFindAllByCourseIds.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should find a list of tasks', async () => {
			const course = courseFactory.build();
			const task1 = new Task({ name: 'task #1', private: false, parent: course });
			const task2 = new Task({ name: 'task #2', private: false, parent: course });
			const task3 = new Task({ name: 'task #2', private: false, parent: course });

			const spyTaskRepoFindAllByParentIds = setTaskRepoMock.findAllByParentIds([task1, task2, task3]);
			const spyLessonRepoFindAllByCourseIds = setLessonRepoMock.findAllByCourseIds([]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAll(currentUser, paginationQuery);
			expect(count).toEqual(3);
			expect(result.length).toEqual(3);

			spyTaskRepoFindAllByParentIds.mockRestore();
			spyLessonRepoFindAllByCourseIds.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should compute submitted status for task', async () => {
			const student = userFactory.build({ firstName: 'John', lastName: 'Doe' });
			student.id = currentUser.userId;
			const course = courseFactory.build();
			const task = new Task({ name: 'task #1', private: false, parent: course });
			const submission = new Submission({ task, student, comment: 'my solution to the task #1' });
			task.submissions = new Collection<Submission>(task, [submission]);

			const spyTaskRepoFindAllByParentIds = setTaskRepoMock.findAllByParentIds([task]);
			const spyLessonRepoFindAllByCourseIds = setLessonRepoMock.findAllByCourseIds([]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 0,
				submitted: 1,
				maxSubmissions: 1,
				isDraft: false,
			});

			spyTaskRepoFindAllByParentIds.mockRestore();
			spyLessonRepoFindAllByCourseIds.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});
		it('should only count the submissions of the given user', async () => {
			const student1 = userFactory.build({ firstName: 'John', lastName: 'Doe' });
			student1.id = currentUser.userId;
			const student2 = userFactory.build({ firstName: 'Marla', lastName: 'Mathe' });
			student2.id = new ObjectId().toHexString();
			const course = courseFactory.build();
			const task = new Task({ name: 'task #1', private: false, parent: course });
			const submission1 = new Submission({ task, student: student1, comment: 'submission #1' });
			const submission2 = new Submission({ task, student: student2, comment: 'submission #2' });
			task.submissions = new Collection<Submission>(task, [submission1, submission2]);

			const spyTaskRepoFindAllByParentIds = setTaskRepoMock.findAllByParentIds([task]);
			const spyLessonRepoFindAllByCourseIds = setLessonRepoMock.findAllByCourseIds([]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 0,
				submitted: 1,
				maxSubmissions: 1,
				isDraft: false,
			});

			spyTaskRepoFindAllByParentIds.mockRestore();
			spyLessonRepoFindAllByCourseIds.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should compute graded status for task', async () => {
			const student = userFactory.build({ firstName: 'John', lastName: 'Doe' });
			student.id = currentUser.userId;
			const course = courseFactory.build();
			const task = new Task({ name: 'task #1', private: false, parent: course });
			const submission = new Submission({ task, student, comment: 'my solution to the task #1' });
			task.submissions = new Collection<Submission>(task, [submission]);

			const spyGraded = jest.spyOn(submission, 'isGraded').mockImplementation(() => true);
			const spyTaskRepoFindAllByParentIds = setTaskRepoMock.findAllByParentIds([task]);
			const spyLessonRepoFindAllByCourseIds = setLessonRepoMock.findAllByCourseIds([]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(spyGraded).toBeCalled();
			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 1,
				submitted: 1,
				maxSubmissions: 1,
				isDraft: false,
			});

			spyTaskRepoFindAllByParentIds.mockRestore();
			spyLessonRepoFindAllByCourseIds.mockRestore();
			spyGetPermittedCourses.mockRestore();
			spyGraded.mockRestore();
		});

		it('should only count the graded submissions of the given user', async () => {
			const student1 = userFactory.build({ firstName: 'John', lastName: 'Doe' });
			student1.id = currentUser.userId;
			const student2 = userFactory.build({ firstName: 'Marla', lastName: 'Mathe' });
			student2.id = new ObjectId().toHexString();
			const course = courseFactory.build();
			const task = new Task({ name: 'task #1', private: false, parent: course });
			const submission1 = new Submission({ task, student: student1, comment: 'submission #1' });
			const submission2 = new Submission({ task, student: student2, comment: 'submission #2' });
			task.submissions = new Collection<Submission>(task, [submission1, submission2]);

			jest.spyOn(submission1, 'isGraded').mockImplementation(() => true);
			jest.spyOn(submission2, 'isGraded').mockImplementation(() => true);
			const spyTaskRepoFindAllByParentIds = setTaskRepoMock.findAllByParentIds([task]);
			const spyLessonRepoFindAllByCourseIds = setLessonRepoMock.findAllByCourseIds([]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 1,
				submitted: 1,
				maxSubmissions: 1,
				isDraft: false,
			});

			spyTaskRepoFindAllByParentIds.mockRestore();
			spyLessonRepoFindAllByCourseIds.mockRestore();
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
			const spyTaskRepoFindAllByParentIds = setTaskRepoMock.findAllByParentIds([]);
			const spyLessonRepoFindAllByCourseIds = setLessonRepoMock.findAllByCourseIds([]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses([]);

			const paginationQuery = new PaginationQuery();
			await service.findAll(currentUser, paginationQuery);

			const expectedParams = [currentUser.userId, TaskParentPermission.write];
			expect(spyGetPermittedCourses).toHaveBeenCalledWith(...expectedParams);

			spyTaskRepoFindAllByParentIds.mockRestore();
			spyLessonRepoFindAllByCourseIds.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should return a counted result', async () => {
			const spyTaskRepoFindAllByParentIds = setTaskRepoMock.findAllByParentIds([]);
			const spyLessonRepoFindAllByCourseIds = setLessonRepoMock.findAllByCourseIds([]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses([]);

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAll(currentUser, paginationQuery);
			expect(Array.isArray(result)).toBeTruthy();
			expect(count).toEqual(0);

			spyTaskRepoFindAllByParentIds.mockRestore();
			spyLessonRepoFindAllByCourseIds.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should find all tasks by permitted parent ids ordered by newest first', async () => {
			const spyTaskRepoFindAllByParentIds = setTaskRepoMock.findAllByParentIds([]);
			const parentIds = [new ObjectId().toHexString(), new ObjectId().toHexString(), new ObjectId().toHexString()];
			const course = courseFactory.build();
			const lesson = new Lesson({ course, hidden: false });
			Object.assign(lesson, { _id: new ObjectId() });
			const spyLessonRepoFindAllByCourseIds = setLessonRepoMock.findAllByCourseIds([lesson]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses(parentIds);

			const paginationQuery = new PaginationQuery();
			await service.findAll(currentUser, paginationQuery);

			const expectedParams = [
				{ teacherId: currentUser.userId, courseIds: parentIds, lessonIds: [lesson.id] },
				undefined,
				{ order: { dueDate: 'desc' }, pagination: { skip: paginationQuery.skip, limit: paginationQuery.limit } },
			];

			expect(spyTaskRepoFindAllByParentIds).toHaveBeenCalledWith(...expectedParams);

			spyTaskRepoFindAllByParentIds.mockRestore();
			spyLessonRepoFindAllByCourseIds.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should return well formed task with parent and status', async () => {
			const course = courseFactory.build();
			const task = new Task({ name: 'task #1', private: true, parent: course });

			const spyTaskRepoFindAllByParentIds = setTaskRepoMock.findAllByParentIds([task]);
			const spyLessonRepoFindAllByCourseIds = setLessonRepoMock.findAllByCourseIds([]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);
			expect(result[0]).toEqual({
				task,
				status: { submitted: 0, maxSubmissions: course.getNumberOfStudents(), graded: 0, isDraft: true },
			});
			expect(result[0].task.parent).toBeDefined();

			spyTaskRepoFindAllByParentIds.mockRestore();
			spyLessonRepoFindAllByCourseIds.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should find a list of tasks', async () => {
			const course = courseFactory.build();
			const task1 = new Task({ name: 'task #1', private: false, parent: course });
			const task2 = new Task({ name: 'task #2', private: false, parent: course });
			const task3 = new Task({ name: 'task #2', private: false, parent: course });

			const spyTaskRepoFindAllByParentIds = setTaskRepoMock.findAllByParentIds([task1, task2, task3]);
			const spyLessonRepoFindAllByCourseIds = setLessonRepoMock.findAllByCourseIds([]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAll(currentUser, paginationQuery);
			expect(count).toEqual(3);
			expect(result.length).toEqual(3);

			spyTaskRepoFindAllByParentIds.mockRestore();
			spyLessonRepoFindAllByCourseIds.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should compute submitted status for task', async () => {
			const student = userFactory.build({ firstName: 'John', lastName: 'Doe' });
			student.id = new ObjectId().toHexString();
			const course = courseFactory.build();
			const task = new Task({ name: 'task #1', private: false, parent: course });
			const submission = new Submission({ task, student, comment: 'my solution to the task #1' });
			task.submissions = new Collection<Submission>(task, [submission]);

			const spyTaskRepoFindAllByParentIds = setTaskRepoMock.findAllByParentIds([task]);
			const spyLessonRepoFindAllByCourseIds = setLessonRepoMock.findAllByCourseIds([]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 0,
				submitted: 1,
				maxSubmissions: course.getNumberOfStudents(),
				isDraft: false,
			});

			spyTaskRepoFindAllByParentIds.mockRestore();
			spyLessonRepoFindAllByCourseIds.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should count all student ids of submissions', async () => {
			const student1 = userFactory.build({ firstName: 'John', lastName: 'Doe' });
			student1.id = new ObjectId().toHexString();
			const student2 = userFactory.build({ firstName: 'Marla', lastName: 'Mathe' });
			student2.id = new ObjectId().toHexString();
			const course = courseFactory.build();
			const task = new Task({ name: 'task #1', private: false, parent: course });
			const submission1 = new Submission({ task, student: student1, comment: 'submission #1' });
			const submission2 = new Submission({ task, student: student2, comment: 'submission #2' });
			task.submissions = new Collection<Submission>(task, [submission1, submission2]);

			const spyTaskRepoFindAllByParentIds = setTaskRepoMock.findAllByParentIds([task]);
			const spyLessonRepoFindAllByCourseIds = setLessonRepoMock.findAllByCourseIds([]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 0,
				submitted: 2,
				maxSubmissions: course.getNumberOfStudents(),
				isDraft: false,
			});

			spyTaskRepoFindAllByParentIds.mockRestore();
			spyLessonRepoFindAllByCourseIds.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should compute graded status for task', async () => {
			const student = userFactory.build({ firstName: 'John', lastName: 'Doe' });
			student.id = new ObjectId().toHexString();
			const course = courseFactory.build();
			const task = new Task({ name: 'task #1', private: false, parent: course });
			const submission = new Submission({ task, student, comment: 'my solution to the task #1' });
			task.submissions = new Collection<Submission>(task, [submission]);

			const spyGraded = jest.spyOn(submission, 'isGraded').mockImplementation(() => true);
			const spyTaskRepoFindAllByParentIds = setTaskRepoMock.findAllByParentIds([task]);
			const spyLessonRepoFindAllByCourseIds = setLessonRepoMock.findAllByCourseIds([]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(spyGraded).toBeCalled();
			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 1,
				submitted: 1,
				maxSubmissions: course.getNumberOfStudents(),
				isDraft: false,
			});

			spyTaskRepoFindAllByParentIds.mockRestore();
			spyLessonRepoFindAllByCourseIds.mockRestore();
			spyGetPermittedCourses.mockRestore();
			spyGraded.mockRestore();
		});

		it('should count all student ids of graded submissions', async () => {
			const student1 = userFactory.build({ firstName: 'John', lastName: 'Doe' });
			student1.id = currentUser.userId;
			const student2 = userFactory.build({ firstName: 'Marla', lastName: 'Mathe' });
			student2.id = new ObjectId().toHexString();
			const course = courseFactory.build();
			const task = new Task({ name: 'task #1', private: false, parent: course });
			const submission1 = new Submission({ task, student: student1, comment: 'submission #1' });
			const submission2 = new Submission({ task, student: student2, comment: 'submission #2' });
			task.submissions = new Collection<Submission>(task, [submission1, submission2]);

			jest.spyOn(submission1, 'isGraded').mockImplementation(() => true);
			jest.spyOn(submission2, 'isGraded').mockImplementation(() => true);
			const spyTaskRepoFindAllByParentIds = setTaskRepoMock.findAllByParentIds([task]);
			const spyLessonRepoFindAllByCourseIds = setLessonRepoMock.findAllByCourseIds([]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 2,
				submitted: 2,
				maxSubmissions: course.getNumberOfStudents(),
				isDraft: false,
			});

			spyTaskRepoFindAllByParentIds.mockRestore();
			spyLessonRepoFindAllByCourseIds.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should count only unique student ids of graded submissions', async () => {
			const student1 = userFactory.build({ firstName: 'John', lastName: 'Doe' });
			student1.id = currentUser.userId;
			const student2 = userFactory.build({ firstName: 'Marla', lastName: 'Mathe' });
			student2.id = new ObjectId().toHexString();
			const course = courseFactory.build();
			const task = new Task({ name: 'task #1', private: false, parent: course });
			const submission1 = new Submission({ task, student: student1, comment: 'submission #1' });
			const submission2 = new Submission({ task, student: student2, comment: 'submission #2' });
			const submission3 = new Submission({ task, student: student2, comment: 'submission #3' });
			task.submissions = new Collection<Submission>(task, [submission1, submission2, submission3]);

			jest.spyOn(submission1, 'isGraded').mockImplementation(() => true);
			jest.spyOn(submission2, 'isGraded').mockImplementation(() => true);
			jest.spyOn(submission3, 'isGraded').mockImplementation(() => true);
			const spyTaskRepoFindAllByParentIds = setTaskRepoMock.findAllByParentIds([task]);
			const spyLessonRepoFindAllByCourseIds = setLessonRepoMock.findAllByCourseIds([]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 2,
				submitted: 2,
				maxSubmissions: course.getNumberOfStudents(),
				isDraft: false,
			});

			spyTaskRepoFindAllByParentIds.mockRestore();
			spyLessonRepoFindAllByCourseIds.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});

		it('should count only unique student ids of submissions', async () => {
			const student1 = userFactory.build({ firstName: 'John', lastName: 'Doe' });
			student1.id = new ObjectId().toHexString();
			const student2 = userFactory.build({ firstName: 'Marla', lastName: 'Mathe' });
			student2.id = new ObjectId().toHexString();
			const course = courseFactory.build();
			const task = new Task({ name: 'task #1', private: false, parent: course });
			const submission1 = new Submission({ task, student: student1, comment: 'submission #1' });
			const submission2 = new Submission({ task, student: student1, comment: 'submission #2' });
			const submission3 = new Submission({ task, student: student2, comment: 'submission #2' });
			task.submissions = new Collection<Submission>(task, [submission1, submission2, submission3]);

			const spyTaskRepoFindAllByParentIds = setTaskRepoMock.findAllByParentIds([task]);
			const spyLessonRepoFindAllByCourseIds = setLessonRepoMock.findAllByCourseIds([]);
			const spyGetPermittedCourses = setAuthorizationServiceMock.getPermittedCourses();

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAll(currentUser, paginationQuery);

			expect(result.length).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 0,
				submitted: 2,
				maxSubmissions: course.getNumberOfStudents(),
				isDraft: false,
			});

			spyTaskRepoFindAllByParentIds.mockRestore();
			spyLessonRepoFindAllByCourseIds.mockRestore();
			spyGetPermittedCourses.mockRestore();
		});
	});
});
