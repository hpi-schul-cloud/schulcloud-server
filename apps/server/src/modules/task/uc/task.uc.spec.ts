import { Test, TestingModule } from '@nestjs/testing';

import { PaginationQuery } from '@shared/controller';
import { EntityId, IFindOptions, SortOrder } from '@shared/domain';
import { Course } from '@src/entities';
import { CourseRepo } from '@src/repositories';

import { Submission, Task } from '../entity';
import { TaskParentTestEntity, TaskTestHelper } from '../utils/TestHelper';
import { SubmissionRepo, TaskRepo } from '../repo';

import { TaskUC } from './task.uc';

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
						findAllCurrent() {
							throw new Error('Please write a mock for TaskRepo.findAllCurrent.');
						},
					},
				},
				SubmissionRepo,
				{
					provide: SubmissionRepo,
					useValue: {
						findByTasks() {
							throw new Error('Please write a mock for SubmissionRepo.findByTasks');
						},
						findByUserId() {
							throw new Error('Please write a mock for SubmissionRepo.findByUserId');
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
		findByUserId: (data: Submission[] = []) => {
			const spy = jest.spyOn(submissionRepo, 'findByUserId').mockImplementation(() => {
				return Promise.resolve([data, data.length]);
			});
			return spy;
		},
		findByTasks: (data: Submission[] = []) => {
			const spy = jest.spyOn(submissionRepo, 'findByTasks').mockImplementation(() => {
				return Promise.resolve([data, data.length]);
			});
			return spy;
		},
	};

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

	const setParentRepoMock = {
		findAllByUserId: (data: TaskParentTestEntity[] = []) => {
			const spy = jest.spyOn(courseRepo, 'findAllByUserId').mockImplementation(() => {
				const mapped = data as unknown[];
				return Promise.resolve([mapped as Course[], mapped.length]);
			});
			return spy;
		},
	};

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	// TODO: make it sense to write test for it if we want combine student, teacher and open?
	describe('findAllOpenForStudent', () => {
		const findAllOpenForStudentMocks = (
			parents: TaskParentTestEntity[],
			tasks: Task[],
			submissions: Submission[] = []
		) => {
			const spy1 = setParentRepoMock.findAllByUserId(parents);
			const spy2 = setSubmissionRepoMock.findByUserId(submissions);
			const spy3 = setTaskRepoMock.findAllCurrent(tasks);

			const mockRestore = () => {
				spy1.mockRestore();
				spy2.mockRestore();
				spy3.mockRestore();
			};
			return mockRestore;
		};

		// TODO: coursegroups test completly missing
		// TODO: how work this stuff with lessons
		// TODO: how work this stuff with ignoredTask

		it('should return pagination promise', async () => {
			const helper = new TaskTestHelper();

			const tasks = [];
			const parents = [];

			const mockRestore = findAllOpenForStudentMocks(parents, tasks);

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAllOpenForStudent(helper.getFirstUser() as EntityId, paginationQuery);

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
			const [result, count] = await service.findAllOpenForStudent(helper.getFirstUser() as EntityId, paginationQuery);

			expect(count).toEqual(1);

			mockRestore();
		});

		it('should return well formed task with parent and stauts', async () => {
			const helper = new TaskTestHelper();
			const parent1 = helper.createTaskParent();
			const task1 = helper.createTask(parent1.id);

			const tasks = [task1];
			const parents = [parent1];

			const mockRestore = findAllOpenForStudentMocks(parents, tasks);

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAllOpenForStudent(helper.getFirstUser() as EntityId, paginationQuery);

			expect(result[0]).toEqual({ task: task1, status: { submitted: 0, maxSubmissions: 1, graded: 0 } });
			expect(result[0].task.getParent()).toBeDefined();

			mockRestore();
		});

		it.skip('should not find a private task', async () => {
			const helper = new TaskTestHelper();
			const parent1 = helper.createTaskParent();
			const task1 = new Task({ name: 'Test task #1', parentId: parent1.id, private: true });

			const tasks = [task1];
			const parents = [parent1];

			const mockRestore = findAllOpenForStudentMocks(parents, tasks);

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAllOpenForStudent(helper.getFirstUser() as EntityId, paginationQuery);

			expect(count).toEqual(0);

			mockRestore();
		});

		it('should work for parent without tasks', async () => {
			const helper = new TaskTestHelper();
			const parent1 = helper.createTaskParent();

			const tasks = [];
			const parents = [parent1];

			const mockRestore = findAllOpenForStudentMocks(parents, tasks);

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAllOpenForStudent(helper.getFirstUser() as EntityId, paginationQuery);

			expect(count).toEqual(0);

			mockRestore();
		});

		it.skip('should not find task from parents where the user has write permissions', async () => {
			const helper = new TaskTestHelper();
			const parent1 = helper.createTaskParent();
			parent1.userIdWithWritePermissions = helper.getFirstUser() as EntityId;
			const task1 = helper.createTask(parent1.id);

			const tasks = [task1];
			const parents = [parent1];

			const mockRestore = findAllOpenForStudentMocks(parents, tasks);

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAllOpenForStudent(helper.getFirstUser() as EntityId, paginationQuery);

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
			const [result, count] = await service.findAllOpenForStudent(helper.getFirstUser() as EntityId, paginationQuery);

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
			const [result, count] = await service.findAllOpenForStudent(helper.getFirstUser() as EntityId, paginationQuery);

			expect(count).toEqual(3);

			mockRestore();
		});

		it('should work if no parent is matched', async () => {
			const helper = new TaskTestHelper();

			const tasks = [];
			const parents = [];

			const mockRestore = findAllOpenForStudentMocks(parents, tasks);

			const paginationQuery = new PaginationQuery();
			const [result, count] = await service.findAllOpenForStudent(helper.getFirstUser() as EntityId, paginationQuery);

			expect(count).toEqual(0);

			mockRestore();
		});

		it('should pass pagination and order', async () => {
			const helper = new TaskTestHelper();

			const tasks = [];
			const parents = [];

			const mockRestore = findAllOpenForStudentMocks(parents, tasks);
			const spy = setTaskRepoMock.findAllCurrent([]);

			const skip = 0;
			const limit = 10;

			const expectedOptions: IFindOptions<Task> = {
				pagination: { skip: 0, limit: 10 },
				order: { dueDate: SortOrder.asc },
			};

			await service.findAllOpenForStudent(helper.getFirstUser() as EntityId, { skip, limit });

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
			const [result, count] = await service.findAllOpenForStudent(helper.getFirstUser() as EntityId, paginationQuery);

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
			const [result, count] = await service.findAllOpenForStudent(helper.getFirstUser() as EntityId, paginationQuery);

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
			const [result, count] = await service.findAllOpenForStudent(helper.getFirstUser() as EntityId, paginationQuery);

			expect(count).toEqual(1);
			expect(result[0].status).toEqual({
				graded: 0,
				submitted: 1,
				maxSubmissions: 1,
			});

			mockRestore();
		});
	});

	describe('findAllOpen', () => {
		it.todo('write tests...');
	});

	// TODO: muss check and rewrite
	describe.skip('findAllOpenByTeacher', () => {
		it.skip('should return task with statistics', async () => {
			/*
			const helper = new TaskTestHelper();

			const parent1 = helper.createTaskParent() as Course;
			const parent2 = helper.createTaskParent() as Course;
			const courses = [parent1, parent2];

			const task1 = helper.createTask(parent1.id);
			const task2 = helper.createTask(parent2.id);
			const tasks = [task1, task2];

			const findAllAssignedByTeacherSpy = jest.spyOn(taskRepo, 'findAllAssignedByTeacher').mockImplementation(() => {
				return Promise.resolve([tasks, 2]);
			});

			const getSubmissionsByTasksListSpy = jest
				.spyOn(submissionRepo, 'getSubmissionsByTasksList')
				.mockImplementation(() => {
					return Promise.resolve([[], 0] as Counted<Submission[]>);
				});

			const facadeSpy = jest.spyOn(facade, 'findCoursesWithGroupsByUserId').mockImplementation((userId: EntityId) => {
				return Promise.resolve([courses, 2]);
			});

			const [responseTasks, total] = await service.findAllOpenByTeacher('abc', new PaginationQuery());
			expect(total).toEqual(2);
			expect(responseTasks.length).toEqual(2);
			expect(responseTasks[0].status).toHaveProperty('submitted');
			expect(responseTasks[0].status).toHaveProperty('maxSubmissions');
			expect(responseTasks[0].status).toHaveProperty('graded');

			findAllAssignedByTeacherSpy.mockRestore();
			getSubmissionsByTasksListSpy.mockRestore();
			facadeSpy.mockRestore();
			*/
		});

		it.skip('should handle submissions of different tasks seperately', async () => {
			/*
			const task1 = { name: 'task1' };
			const task2 = { name: 'task2' };
			const findAllAssignedByTeacherSpy = jest.spyOn(taskRepo, 'findAllAssignedByTeacher').mockImplementation(() => {
				const tasks = [task1, task2] as Task[];
				return Promise.resolve([tasks, 2]);
			});
			const getSubmissionsByTasksListSpy = jest
				.spyOn(submissionRepo, 'getSubmissionsByTasksList')
				.mockImplementation(() => {
					return Promise.resolve([[{ task: task1 }, { task: task2 }], 0] as Counted<Submission[]>);
				});

			const computeSubmissionMetadataSpy = jest
				.spyOn(taskSubmissionMetadata, 'submissionStatusForTask')
				.mockImplementation((submissions: Submission[]) => {
					return { submitted: submissions.length, maxSubmissions: 0, graded: 0 };
				});

			const [tasks, total] = await service.findAllOpenByTeacher('abc', new PaginationQuery());
			expect(total).toEqual(2);
			expect(tasks.length).toEqual(2);
			expect(tasks[0].status?.submitted).toEqual(1);
			expect(tasks[1].status?.submitted).toEqual(1);

			findAllAssignedByTeacherSpy.mockRestore();
			getSubmissionsByTasksListSpy.mockRestore();
			// computeSubmissionMetadataSpy.mockRestore();
			*/
		});
	});
});
