import { Test, TestingModule } from '@nestjs/testing';

import { PaginationQuery } from '@shared/controller';

import { LearnroomFacade } from '../../learnroom';
import { Course } from '../../learnroom/entity';

import { TaskTestHelper } from '../utils/TestHelper';
import { SubmissionRepo, TaskRepo } from '../repo';

import { TaskUC } from './task.uc';

describe('TaskService', () => {
	let service: TaskUC;
	let taskRepo: TaskRepo;
	let submissionRepo: SubmissionRepo;
	let facade: LearnroomFacade;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TaskUC,
				LearnroomFacade,
				{
					provide: LearnroomFacade,
					useValue: {
						findCoursesWithGroupsByUserId() {
							throw new Error('Please write a mock for LearnroomFacade.findCoursesWithGroupsByUserId.');
						},
					},
				},
				TaskRepo,
				{
					provide: TaskRepo,
					useValue: {
						findAllAssignedByTeacher() {
							throw new Error('Please write a mock for TaskRepo.findAllAssignedByTeacher.');
						},
						findAllByStudent() {
							throw new Error('Please write a mock for TaskRepo.findAllByStudent.');
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
		facade = module.get(LearnroomFacade);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	// TODO: make it sense to write test for it if we want combine student, teacher and open?
	describe('findAllOpenForStudent', () => {
		it('should called all external methodes', async () => {
			const helper = new TaskTestHelper();
			const findByUserIdSpy = jest.spyOn(submissionRepo, 'findByUserId').mockImplementation(() => {
				return Promise.resolve([[], 0]);
			});

			const findAllByStudentMock = jest.spyOn(taskRepo, 'findAllByStudent').mockImplementation(() => {
				return Promise.resolve([[], 0]);
			});

			const facadeSpy = jest.spyOn(facade, 'findCoursesWithGroupsByUserId').mockImplementation(() => {
				return Promise.resolve([[], 0]);
			});

			const paginationQuery = new PaginationQuery();
			await service.findAllOpenForStudent(helper.getFirstUser().id, paginationQuery);

			expect(findAllByStudentMock).toHaveBeenCalledWith([], paginationQuery, []);
			expect(facadeSpy).toHaveBeenCalledWith(helper.getFirstUser().id);
			expect(findByUserIdSpy).toHaveBeenCalledWith(helper.getFirstUser().id);

			findByUserIdSpy.mockRestore();
			findAllByStudentMock.mockRestore();
			facadeSpy.mockRestore();
		});

		// test formating

		it('should find only not submitted tasks', async () => {
			const helper = new TaskTestHelper();

			const parent1 = helper.createTaskParent();
			const parent2 = helper.createTaskParent();
			const parents = [parent1, parent2] as Course[];

			const task1 = helper.createTask(parent1.id);
			const task2 = helper.createTask(parent2.id);
			const task3 = helper.createTask(parent2.id); // two task in one course

			const submissionTask1 = helper.createSubmission(task1);
			const submissionTask2 = helper.createSubmission(task2);
			// task3 has no submission

			const tasks = [task1, task2, task3];
			const submissions = [submissionTask1, submissionTask2];

			const getAllSubmissionsByUserSpy = jest.spyOn(submissionRepo, 'findByUserId').mockImplementation(() => {
				return Promise.resolve([submissions, 3]);
			});

			const findAllByStudentMock = jest.spyOn(taskRepo, 'findAllByStudent').mockImplementation(() => {
				return Promise.resolve([tasks, 2]);
			});

			const facadeSpy = jest.spyOn(facade, 'findCoursesWithGroupsByUserId').mockImplementation(() => {
				return Promise.resolve([parents, 2]);
			});

			const paginationQuery = new PaginationQuery();
			const [computedTasks, count] = await service.findAllOpenForStudent(helper.getFirstUser().id, paginationQuery);

			expect(count).toEqual(1);

			getAllSubmissionsByUserSpy.mockRestore();
			findAllByStudentMock.mockRestore();
			facadeSpy.mockRestore();
		});

		it.todo('should ignore tasks with submissions');
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
