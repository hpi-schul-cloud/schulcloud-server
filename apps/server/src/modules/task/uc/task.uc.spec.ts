import { Test, TestingModule } from '@nestjs/testing';
import { PaginationQuery } from '@shared/controller/dto/pagination.query';
import { Submission, Task, UserTaskInfo, CourseTaskInfo } from '../entity';
import { SubmissionRepo } from '../repo/submission.repo';
import { Counted } from '../../../shared/domain';
import { TaskRepo } from '../repo/task.repo';
import { TaskUC } from './task.uc';

describe('TaskService', () => {
	let service: TaskUC;
	let taskRepo: TaskRepo;
	let submissionRepo: SubmissionRepo;

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
			],
		}).compile();

		service = module.get<TaskUC>(TaskUC);
		submissionRepo = module.get<SubmissionRepo>(SubmissionRepo);
		taskRepo = module.get<TaskRepo>(TaskRepo);
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
			const computeSubmissionMetadataSpy = jest.spyOn(service, 'computeSubmissionMetadata').mockImplementation(() => {
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
				.spyOn(service, 'computeSubmissionMetadata')
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

	describe('getTaskSubmissionMetadata', () => {
		it('should return the number of students that submitted', () => {
			const task = new Task({ course: new CourseTaskInfo({}) });
			const testdata = [
				new Submission({ student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }) }),
				new Submission({ student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'def' }) }),
			];

			const result = service.computeSubmissionMetadata(testdata, task);
			expect(result.submitted).toEqual(2);
		});

		it('should count submissions by the same student only once', () => {
			const task = new Task({ course: new CourseTaskInfo({}) });
			const testdata = [
				new Submission({ student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }) }),
				new Submission({ student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }) }),
			];

			const result = service.computeSubmissionMetadata(testdata, task);
			expect(result.submitted).toEqual(1);
		});

		it('should return the maximum number of students that could submit', () => {
			const task = { name: 'name', course: { students: [{ id: 'abc' }, { id: 'def' }] } } as unknown;

			const result = service.computeSubmissionMetadata([], task as Task);
			expect(result.maxSubmissions).toEqual(2);
		});

		it('should return the number of submissions that have been graded', () => {
			const task = new Task({ course: new CourseTaskInfo({}) });
			const testdata = [
				new Submission({
					student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }),
					grade: 50,
				}),
				new Submission({
					student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'def' }),
					gradeComment: 'well done',
				}),
				// TODO: add grade file case
				/* new Submission({
							student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'def' }),
							gradeFileIds: [new FileTaskInfo({})],
						}), */
				new Submission({
					student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'def' }),
				}),
			];

			const result = service.computeSubmissionMetadata(testdata, task);
			expect(result.graded).toEqual(2);
		});

		it('should consider only the newest submission per user for grading', () => {
			const task = new Task({ course: new CourseTaskInfo({}) });
			const testdata = [
				new Submission({
					student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }),
					createdAt: new Date(Date.now()),
				}),
				new Submission({
					student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }),
					gradeComment: 'well done',
					createdAt: new Date(Date.now() - 500),
				}),
			];

			const result = service.computeSubmissionMetadata(testdata, task);
			expect(result.graded).toEqual(1);
		});
	});
});
