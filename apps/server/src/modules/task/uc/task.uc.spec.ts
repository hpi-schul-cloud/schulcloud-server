import { Test, TestingModule } from '@nestjs/testing';

import { createCurrentTestUser } from '@src/modules/user/utils';
import { PaginationQuery } from '@shared/controller';
import { IFindOptions, SortOrder, BaseEntity } from '@shared/domain';
import { Course } from '@src/entities';
import { CourseRepo } from '@src/repositories';

import { Submission, Task } from '../entity';
import { TaskParentTestEntity, TaskTestHelper } from '../utils/TestHelper';
import { SubmissionRepo, TaskRepo } from '../repo';

import { TaskUC } from './task.uc';

// TODO: coursegroups test completly missing
// TODO: how work this stuff with lessons
// TODO: how work this stuff with ignoredTask

describe('TaskService', () => {
	let service: TaskUC;
	let taskRepo: TaskRepo;
	let submissionRepo: SubmissionRepo;
	let courseRepo: CourseRepo;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TaskUC,
				CourseRepo,
				{
					provide: CourseRepo,
					useValue: {
						findAllByUserId() {
							throw new Error('Please write a mock for LearnroomFacade.findCoursesWithGroupsByUserId.');
						},
					},
				},
				TaskRepo,
				{
					provide: TaskRepo,
					useValue: {
						findAll() {
							throw new Error('Please write a mock for TaskRepo.findAll.');
						},
						findAllCurrentByIds() {
							throw new Error('Please write a mock for TaskRepo.findAllCurrentByIds.');
						},
						findAllCurrentIgnoreIds() {
							throw new Error('Please write a mock for TaskRepo.findAllCurrentIgnoreIds.');
						},
					},
				},
				SubmissionRepo,
				{
					provide: SubmissionRepo,
					useValue: {
						findAllByTaskIds() {
							throw new Error('Please write a mock for SubmissionRepo.findAllByTaskIds');
						},
						findAllByUserId() {
							throw new Error('Please write a mock for SubmissionRepo.findAllByUserId');
						},
						findGradedByUserId() {
							throw new Error('Please write a mock for SubmissionRepo.findGradedByUserId');
						},
					},
				},
			],
		}).compile();

		service = module.get(TaskUC);
		submissionRepo = module.get(SubmissionRepo);
		taskRepo = module.get(TaskRepo);
		courseRepo = module.get(CourseRepo);
	});

	const setSubmissionRepoMock = {
		findAllByUserId: (data: Submission[] = []) => {
			const spy = jest.spyOn(submissionRepo, 'findAllByUserId').mockImplementation(() => {
				return Promise.resolve([data, data.length]);
			});
			return spy;
		},
		findAllByTaskIds: (data: Submission[] = []) => {
			const spy = jest.spyOn(submissionRepo, 'findAllByTaskIds').mockImplementation(() => {
				return Promise.resolve([data, data.length]);
			});
			return spy;
		},
		findGradedByUserId: (data: Submission[] = []) => {
			const spy = jest.spyOn(submissionRepo, 'findGradedByUserId').mockImplementation(() => {
				return Promise.resolve([data, data.length]);
			});
			return spy;
		},
	};

	const setTaskRepoMock = {
		findAllCurrentByIds: (data: Task[] = []) => {
			const spy = jest.spyOn(taskRepo, 'findAllCurrentByIds').mockImplementation(() => {
				return Promise.resolve([data, data.length]);
			});
			return spy;
		},
		findAllCurrentIgnoreIds: (data: Task[] = []) => {
			const spy = jest.spyOn(taskRepo, 'findAllCurrentIgnoreIds').mockImplementation(() => {
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

	const setParentRepoMock = {
		findAllByUserId: (data: TaskParentTestEntity[] = []) => {
			const spy = jest.spyOn(courseRepo, 'findAllByUserId').mockImplementation(() => {
				const mapped = data as unknown[];
				return Promise.resolve([mapped as Course[], mapped.length]);
			});
			return spy;
		},
	};

	const setTaskUCMock = {
		findAllOpenByTeacher: () => {
			const spy = jest.spyOn(service, 'findAllOpenByTeacher').mockImplementation(() => {
				return Promise.resolve([[], 0]);
			});
			return spy;
		},
		findAllOpenForStudent: () => {
			const spy = jest.spyOn(service, 'findAllOpenForStudent').mockImplementation(() => {
				return Promise.resolve([[], 0]);
			});
			return spy;
		},
	};

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('findAllOpen', () => {
		enum TaskPermissionFlags {
			read = 'TASK_DASHBOARD_VIEW_V3',
			write = 'TASK_DASHBOARD_TEACHER_VIEW_V3',
		}

		const findAllOpenMock = () => {
			const spy1 = setTaskUCMock.findAllOpenByTeacher();
			const spy2 = setTaskUCMock.findAllOpenForStudent();

			const mockRestore = () => {
				spy1.mockRestore();
				spy2.mockRestore();
			};

			return mockRestore;
		};

		it('should throw if no permission exist', async () => {
			const permissions = [];
			const { currentUser } = createCurrentTestUser(permissions);

			const mockRestore = findAllOpenMock();

			const paginationQuery = new PaginationQuery();
			const action = async () => service.findAllOpen(currentUser, paginationQuery);
			await expect(action()).rejects.toThrow();

			mockRestore();
		});

		it(`should pass if ${TaskPermissionFlags.read} flag exist and call findAllOpenForStudent.`, async () => {
			const permissions = [TaskPermissionFlags.read];
			const { currentUser } = createCurrentTestUser(permissions);

			const mockRestore = findAllOpenMock();
			const spy = setTaskUCMock.findAllOpenForStudent();

			const paginationQuery = new PaginationQuery();
			const result = await service.findAllOpen(currentUser, paginationQuery);

			expect(result).toEqual([[], 0]);
			expect(spy).toBeCalledTimes(1);

			spy.mockRestore();
			mockRestore();
		});

		it(`should pass if ${TaskPermissionFlags.write} flag exist and call findAllOpenByTeacher.`, async () => {
			const permissions = [TaskPermissionFlags.write];
			const { currentUser } = createCurrentTestUser(permissions);

			const mockRestore = findAllOpenMock();
			const spy = setTaskUCMock.findAllOpenByTeacher();

			const paginationQuery = new PaginationQuery();
			const result = await service.findAllOpen(currentUser, paginationQuery);

			expect(result).toEqual([[], 0]);
			expect(spy).toBeCalledTimes(1);

			spy.mockRestore();
			mockRestore();
		});
	});

	describe('findAllOpenForStudent', () => {
		const findAllOpenForStudentMocks = (
			parents: TaskParentTestEntity[],
			tasks: Task[],
			submissions: Submission[] = []
		) => {
			const spy1 = setParentRepoMock.findAllByUserId(parents);
			const spy2 = setSubmissionRepoMock.findAllByUserId(submissions);
			const spy3 = setTaskRepoMock.findAllCurrentIgnoreIds(tasks);

			const mockRestore = () => {
				spy1.mockRestore();
				spy2.mockRestore();
				spy3.mockRestore();
			};
			return mockRestore;
		};

		it('should return pagination promise', async () => {
			const helper = new TaskTestHelper();

			const tasks = [];
			const parents = [];

			const mockRestore = findAllOpenForStudentMocks(parents, tasks);

			const paginationQuery = new PaginationQuery();
			const user = helper.getFirstUser() as BaseEntity;
			const [result, count] = await service.findAllOpenForStudent(user.id, paginationQuery);

			expect(Array.isArray(result)).toBeTruthy();
			expect(count).toEqual(0);

			mockRestore();
		});

		it('should find a open task', async () => {
			const helper = new TaskTestHelper();
			const parent1 = helper.createTaskParent();
			const task1 = helper.createTask(parent1.id);

			const tasks = [task1];
			const parents = [parent1];

			const mockRestore = findAllOpenForStudentMocks(parents, tasks);

			const paginationQuery = new PaginationQuery();
			const user = helper.getFirstUser() as BaseEntity;
			const [result, count] = await service.findAllOpenForStudent(user.id, paginationQuery);

			expect(count).toEqual(1);

			mockRestore();
		});

		it('should return well formed task with parent and status', async () => {
			const helper = new TaskTestHelper();
			const parent1 = helper.createTaskParent();
			const task1 = helper.createTask(parent1.id);

			const tasks = [task1];
			const parents = [parent1];

			const mockRestore = findAllOpenForStudentMocks(parents, tasks);

			const paginationQuery = new PaginationQuery();
			const user = helper.getFirstUser() as BaseEntity;
			const [result] = await service.findAllOpenForStudent(user.id, paginationQuery);

			expect(result[0]).toEqual({ task: task1, status: { submitted: 0, maxSubmissions: 1, graded: 0 } });
			expect(result[0].task.getParent()).toBeDefined();

			mockRestore();
		});

		it('should work for parent without tasks', async () => {
			const helper = new TaskTestHelper();
			const parent1 = helper.createTaskParent();

			const tasks = [];
			const parents = [parent1];

			const mockRestore = findAllOpenForStudentMocks(parents, tasks);

			const paginationQuery = new PaginationQuery();
			const user = helper.getFirstUser() as BaseEntity;
			const [result, count] = await service.findAllOpenForStudent(user.id, paginationQuery);

			expect(count).toEqual(0);

			mockRestore();
		});

		it('should find a list of open task', async () => {
			const helper = new TaskTestHelper();
			const parent1 = helper.createTaskParent();
			const task1 = helper.createTask(parent1.id);
			const task2 = helper.createTask(parent1.id);
			const task3 = helper.createTask(parent1.id);

			const tasks = [task1, task2, task3];
			const parents = [parent1];

			const mockRestore = findAllOpenForStudentMocks(parents, tasks);

			const paginationQuery = new PaginationQuery();
			const user = helper.getFirstUser() as BaseEntity;
			const [result, count] = await service.findAllOpenForStudent(user.id, paginationQuery);

			expect(count).toEqual(3);

			mockRestore();
		});

		it('should find open task from different parents', async () => {
			const helper = new TaskTestHelper();
			const parent1 = helper.createTaskParent();
			const parent2 = helper.createTaskParent();
			const parent3 = helper.createTaskParent();
			const task1 = helper.createTask(parent1.id);
			const task2 = helper.createTask(parent2.id);
			const task3 = helper.createTask(parent3.id);

			const tasks = [task1, task2, task3];
			const parents = [parent1, parent2, parent3];

			const mockRestore = findAllOpenForStudentMocks(parents, tasks);

			const paginationQuery = new PaginationQuery();
			const user = helper.getFirstUser() as BaseEntity;
			const [result, count] = await service.findAllOpenForStudent(user.id, paginationQuery);

			expect(count).toEqual(3);

			mockRestore();
		});

		it('should work if no parent is matched', async () => {
			const helper = new TaskTestHelper();

			const tasks = [];
			const parents = [];

			const mockRestore = findAllOpenForStudentMocks(parents, tasks);

			const paginationQuery = new PaginationQuery();
			const user = helper.getFirstUser() as BaseEntity;
			const [result, count] = await service.findAllOpenForStudent(user.id, paginationQuery);

			expect(count).toEqual(0);

			mockRestore();
		});

		it('should pass pagination and order', async () => {
			const helper = new TaskTestHelper();

			const tasks = [];
			const parents = [];

			const mockRestore = findAllOpenForStudentMocks(parents, tasks);
			const spy = setTaskRepoMock.findAllCurrentIgnoreIds([]);

			const skip = 0;
			const limit = 10;

			const expectedOptions: IFindOptions<Task> = {
				pagination: { skip: 0, limit: 10 },
				order: { dueDate: SortOrder.asc },
			};

			const user = helper.getFirstUser() as BaseEntity;
			await service.findAllOpenForStudent(user.id, { skip, limit });

			expect(spy).toHaveBeenCalledWith([], [], expectedOptions);

			mockRestore();
			spy.mockRestore();
		});

		it('should compute status for task', async () => {
			const helper = new TaskTestHelper();
			const parent1 = helper.createTaskParent();
			const task1 = helper.createTask(parent1.id);
			const submission1 = helper.createSubmission(task1);

			const tasks = [task1];
			const parents = [parent1];
			const submissions = [submission1];

			const mockRestore = findAllOpenForStudentMocks(parents, tasks, submissions);

			const paginationQuery = new PaginationQuery();
			const user = helper.getFirstUser() as BaseEntity;
			const [result] = await service.findAllOpenForStudent(user.id, paginationQuery);

			expect(result[0].status).toEqual({
				graded: 0,
				submitted: 1,
				maxSubmissions: 1,
			});

			mockRestore();
		});

		it('should compute status for multiple tasks', async () => {
			const helper = new TaskTestHelper();
			const parent1 = helper.createTaskParent();
			const parent2 = helper.createTaskParent();
			const parent3 = helper.createTaskParent();
			const task1 = helper.createTask(parent1.id);
			const task2 = helper.createTask(parent1.id);
			const task3 = helper.createTask(parent2.id);
			// parent 3 has no task
			const submission1 = helper.createSubmission(task1);
			// task2 has no submission
			const submission3 = helper.createSubmission(task3);

			const tasks = [task1, task2, task3];
			const parents = [parent1, parent2, parent3];
			const submissions = [submission1, submission3];

			const mockRestore = findAllOpenForStudentMocks(parents, tasks, submissions);

			const paginationQuery = new PaginationQuery();
			const user = helper.getFirstUser() as BaseEntity;
			const [result] = await service.findAllOpenForStudent(user.id, paginationQuery);

			expect(result[0].status).toEqual({
				graded: 0,
				submitted: 1,
				maxSubmissions: 1,
			});

			expect(result[1].status).toEqual({
				graded: 0,
				submitted: 0,
				maxSubmissions: 1,
			});

			expect(result[2].status).toEqual({
				graded: 0,
				submitted: 1,
				maxSubmissions: 1,
			});

			mockRestore();
		});

		it('should compute status for multiple tasks', async () => {
			const helper = new TaskTestHelper();
			const parent1 = helper.createTaskParent();
			const task1 = helper.createTask(parent1.id);

			const submission1 = helper.createSubmission(task1);
			const submission2 = helper.createSubmission(task1);
			const submission3 = helper.createSubmission(task1);

			const tasks = [task1];
			const parents = [parent1];
			const submissions = [submission1, submission2, submission3];

			const mockRestore = findAllOpenForStudentMocks(parents, tasks, submissions);

			const paginationQuery = new PaginationQuery();
			const user = helper.getFirstUser() as BaseEntity;
			const [result, count] = await service.findAllOpenForStudent(user.id, paginationQuery);

			expect(count).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 0,
				submitted: 1,
				maxSubmissions: 1,
			});

			mockRestore();
		});

		/**
		 * This is a passive test if after call to parent no parentId can pass for the next step.
		 */
		it('should only pass parents where the user has no write permissions', async () => {
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as BaseEntity;
			const parent1 = helper.createTaskParent(user.id); // with write permissions

			const tasks = [];
			const parents = [parent1];
			const submissions = [];

			const mockRestore = findAllOpenForStudentMocks(parents, tasks, submissions);
			const spy = setTaskRepoMock.findAllCurrent();

			const paginationQuery = new PaginationQuery();
			await service.findAllOpenForStudent(user.id, paginationQuery);

			const expectedOptions: IFindOptions<Task> = {
				pagination: { skip: 0, limit: 10 },
				order: { dueDate: SortOrder.asc },
			};
			const noParent = [];
			expect(spy).toHaveBeenCalledWith(noParent, [], expectedOptions);

			mockRestore();
		});
	});

	describe('findAllOpenByTeacher', () => {
		const findAllOpenByTeacherMocks = (
			parents: TaskParentTestEntity[],
			tasks: Task[],
			submissions: Submission[] = []
		) => {
			const spy1 = setParentRepoMock.findAllByUserId(parents);
			const spy2 = setSubmissionRepoMock.findByTasks(submissions);
			const spy3 = setTaskRepoMock.findAll(tasks);

			const mockRestore = () => {
				spy1.mockRestore();
				spy2.mockRestore();
				spy3.mockRestore();
			};
			return mockRestore;
		};

		it('should return pagination promise', async () => {
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as BaseEntity;
			const tasks = [];
			const parents = [];

			const mockRestore = findAllOpenByTeacherMocks(parents, tasks);

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAllOpenByTeacher(user.id, paginationQuery);

			expect(Array.isArray(result)).toBeTruthy();
			expect(count).toEqual(0);

			mockRestore();
		});

		it('should find a open task', async () => {
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as BaseEntity;
			const parent1 = helper.createTaskParent(user.id);
			const task1 = helper.createTask(parent1.id);

			const tasks = [task1];
			const parents = [parent1];

			const mockRestore = findAllOpenByTeacherMocks(parents, tasks);

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAllOpenByTeacher(user.id, paginationQuery);

			expect(count).toEqual(1);

			mockRestore();
		});

		it('should return well formed task with parent and status', async () => {
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as BaseEntity;
			const parent1 = helper.createTaskParent(user.id);
			const task1 = helper.createTask(parent1.id);

			const tasks = [task1];
			const parents = [parent1];

			const mockRestore = findAllOpenByTeacherMocks(parents, tasks);

			const paginationQuery = new PaginationQuery();

			const [result] = await service.findAllOpenByTeacher(user.id, paginationQuery);

			expect(result[0]).toEqual({ task: task1, status: { submitted: 0, maxSubmissions: 10, graded: 0 } });
			expect(result[0].task.getParent()).toBeDefined();

			mockRestore();
		});

		it('should work for parent without tasks', async () => {
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as BaseEntity;
			const parent1 = helper.createTaskParent(user.id);

			const tasks = [];
			const parents = [parent1];

			const mockRestore = findAllOpenByTeacherMocks(parents, tasks);

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAllOpenByTeacher(user.id, paginationQuery);

			expect(count).toEqual(0);

			mockRestore();
		});

		it('should find a list of open task', async () => {
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as BaseEntity;
			const parent1 = helper.createTaskParent(user.id);
			const task1 = helper.createTask(parent1.id);
			const task2 = helper.createTask(parent1.id);
			const task3 = helper.createTask(parent1.id);

			const tasks = [task1, task2, task3];
			const parents = [parent1];

			const mockRestore = findAllOpenByTeacherMocks(parents, tasks);

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAllOpenByTeacher(user.id, paginationQuery);

			expect(count).toEqual(3);

			mockRestore();
		});

		it('should find open task from different parents', async () => {
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as BaseEntity;
			const parent1 = helper.createTaskParent(user.id);
			const parent2 = helper.createTaskParent(user.id);
			const parent3 = helper.createTaskParent(user.id);
			const task1 = helper.createTask(parent1.id);
			const task2 = helper.createTask(parent2.id);
			const task3 = helper.createTask(parent3.id);

			const tasks = [task1, task2, task3];
			const parents = [parent1, parent2, parent3];

			const mockRestore = findAllOpenByTeacherMocks(parents, tasks);

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAllOpenByTeacher(user.id, paginationQuery);

			expect(count).toEqual(3);

			mockRestore();
		});

		it('should work if no parent is matched', async () => {
			const helper = new TaskTestHelper();

			const tasks = [];
			const parents = [];

			const mockRestore = findAllOpenByTeacherMocks(parents, tasks);

			const paginationQuery = new PaginationQuery();
			const user = helper.getFirstUser() as BaseEntity;
			const [result, count] = await service.findAllOpenByTeacher(user.id, paginationQuery);

			expect(count).toEqual(0);

			mockRestore();
		});

		it('should pass pagination and order', async () => {
			const helper = new TaskTestHelper();

			const tasks = [];
			const parents = [];

			const mockRestore = findAllOpenByTeacherMocks(parents, tasks);
			const spy = setTaskRepoMock.findAll([]);

			const skip = 0;
			const limit = 10;

			const expectedOptions: IFindOptions<Task> = {
				pagination: { skip: 0, limit: 10 },
				order: { createdAt: SortOrder.desc },
			};

			const user = helper.getFirstUser() as BaseEntity;
			await service.findAllOpenByTeacher(user.id, { skip, limit });

			expect(spy).toHaveBeenCalledWith([], expectedOptions);

			mockRestore();
			spy.mockRestore();
		});

		it('should compute status for task', async () => {
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as BaseEntity;
			const parent1 = helper.createTaskParent(user.id);
			const task1 = helper.createTask(parent1.id);
			const submission1 = helper.createSubmission(task1);

			const tasks = [task1];
			const parents = [parent1];
			const submissions = [submission1];

			const mockRestore = findAllOpenByTeacherMocks(parents, tasks, submissions);

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAllOpenByTeacher(user.id, paginationQuery);

			expect(result[0].status).toEqual({
				graded: 0,
				submitted: 1,
				maxSubmissions: 10,
			});

			mockRestore();
		});

		it('should compute status for multiple tasks', async () => {
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as BaseEntity;
			const parent1 = helper.createTaskParent(user.id);
			const parent2 = helper.createTaskParent(user.id);
			const parent3 = helper.createTaskParent(user.id);
			const task1 = helper.createTask(parent1.id);
			const task2 = helper.createTask(parent1.id);
			const task3 = helper.createTask(parent2.id);
			// parent 3 has no task
			const submission1 = helper.createSubmission(task1);
			// task2 has no submission
			const submission3 = helper.createSubmission(task3);

			const tasks = [task1, task2, task3];
			const parents = [parent1, parent2, parent3];
			const submissions = [submission1, submission3];

			const mockRestore = findAllOpenByTeacherMocks(parents, tasks, submissions);

			const paginationQuery = new PaginationQuery();
			const [result] = await service.findAllOpenByTeacher(user.id, paginationQuery);

			expect(result[0].status).toEqual({
				graded: 0,
				submitted: 1,
				maxSubmissions: 10,
			});

			expect(result[1].status).toEqual({
				graded: 0,
				submitted: 0,
				maxSubmissions: 10,
			});

			expect(result[2].status).toEqual({
				graded: 0,
				submitted: 1,
				maxSubmissions: 10,
			});

			mockRestore();
		});

		it('should compute status for multiple tasks', async () => {
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as BaseEntity;
			const parent1 = helper.createTaskParent(user.id);
			const task1 = helper.createTask(parent1.id);

			const submission1 = helper.createSubmission(task1);
			const submission2 = helper.createSubmission(task1);
			const submission3 = helper.createSubmission(task1);

			const tasks = [task1];
			const parents = [parent1];
			const submissions = [submission1, submission2, submission3];

			const mockRestore = findAllOpenByTeacherMocks(parents, tasks, submissions);

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAllOpenByTeacher(user.id, paginationQuery);

			expect(count).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 0,
				submitted: 1,
				maxSubmissions: 10,
			});

			mockRestore();
		});

		/**
		 * This is a passive test if after call to parent no parentId can pass for the next step.
		 */
		it('should only pass parents where the user has write permissions', async () => {
			const helper = new TaskTestHelper();
			const user = helper.getFirstUser() as BaseEntity;
			const parent1 = helper.createTaskParent(); // no write permissions

			const tasks = [];
			const parents = [parent1];
			const submissions = [];

			const mockRestore = findAllOpenByTeacherMocks(parents, tasks, submissions);
			const spy = setTaskRepoMock.findAll();

			const paginationQuery = new PaginationQuery();
			await service.findAllOpenByTeacher(user.id, paginationQuery);

			const expectedOptions: IFindOptions<Task> = {
				pagination: { skip: 0, limit: 10 },
				order: { createdAt: SortOrder.desc },
			};
			const noParent = [];
			expect(spy).toHaveBeenCalledWith(noParent, expectedOptions);

			mockRestore();
		});
	});
});
