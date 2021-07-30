import { Test, TestingModule } from '@nestjs/testing';
import { PaginationQuery } from '@shared/controller/dto/pagination.query';
import { Submission, Task } from '../entity';
import { SubmissionRepo } from '../repo/submission.repo';
import { Counted } from '../../../shared/domain';
import { TaskRepo } from '../repo/task.repo';
import { TaskUC } from './task.uc';
import { TaskSubmissionMetadataService } from '../domain/task-submission-metadata.service';

describe('TaskService', () => {
	let service: TaskUC;
	let taskRepo: TaskRepo;
	let submissionRepo: SubmissionRepo;
	let taskSubmissionMetadata: TaskSubmissionMetadataService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TaskUC,
				TaskRepo,
				{
					provide: TaskRepo,
					useValue: {
						findAllAssignedByTeacher() {},
						findAllByStudent() {},
					},
				},
				SubmissionRepo,
				{
					provide: SubmissionRepo,
					useValue: {
						getSubmissionsByTasksList() {},
						getAllSubmissionsByUser() {},
					},
				},
				{
					provide: TaskSubmissionMetadataService,
					useValue: {
						submissionStatusForTask() {},
					},
				},
			],
		}).compile();

		service = module.get<TaskUC>(TaskUC);
		submissionRepo = module.get<SubmissionRepo>(SubmissionRepo);
		taskRepo = module.get<TaskRepo>(TaskRepo);
		taskSubmissionMetadata = module.get<TaskSubmissionMetadataService>(TaskSubmissionMetadataService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	// TODO: make it sense to write test for it if we want combine student, teacher and open?
	describe('findAllOpenForStudent', () => {
		it('should ignore tasks with submissions', async () => {
			const getAllSubmissionsByUserSpy = jest
				.spyOn(submissionRepo, 'getAllSubmissionsByUser')
				.mockImplementation(() => {
					const submissions = [{ task: { name: 'atask', id: '123' } }] as Submission[];
					return Promise.resolve([submissions, 1]);
				});
			const findAllByStudentMock = jest.spyOn(taskRepo, 'findAllByStudent').mockImplementation(() => {
				const tasks = [{ name: 'task1' }, { name: 'task2' }] as Task[];
				return Promise.resolve([tasks, 2]);
			});

			const paginationQuery = new PaginationQuery();
			await service.findAllOpenForStudent('someId', paginationQuery);

			expect(findAllByStudentMock).toHaveBeenCalledWith('someId', paginationQuery, ['123']);
		});
	});

	describe('findAllOpen', () => {});

	describe('findAllOpenByTeacher', () => {
		it('should return task with statistics', async () => {
			const findAllAssignedByTeacherSpy = jest.spyOn(taskRepo, 'findAllAssignedByTeacher').mockImplementation(() => {
				const tasks = [{ name: 'task1' }, { name: 'task2' }] as Task[];
				return Promise.resolve([tasks, 2]);
			});
			const getSubmissionsByTasksListSpy = jest
				.spyOn(submissionRepo, 'getSubmissionsByTasksList')
				.mockImplementation(() => {
					return Promise.resolve([[], 0] as Counted<Submission[]>);
				});
			const computeSubmissionMetadataSpy = jest
				.spyOn(taskSubmissionMetadata, 'submissionStatusForTask')
				.mockImplementation(() => {
					return { submitted: 0, maxSubmissions: 1, graded: 0 };
				});

			const [tasks, total] = await service.findAllOpenByTeacher('abc', new PaginationQuery());
			expect(total).toEqual(2);
			expect(tasks.length).toEqual(2);
			expect(tasks[0].status).toHaveProperty('submitted');
			expect(tasks[0].status).toHaveProperty('maxSubmissions');
			expect(tasks[0].status).toHaveProperty('graded');
		});

		it('should handle submissions of different tasks seperately', async () => {
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
		});

		// teacher only --> should not needed
	});
});
