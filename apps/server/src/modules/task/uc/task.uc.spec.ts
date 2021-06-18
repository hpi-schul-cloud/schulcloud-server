import { Test, TestingModule } from '@nestjs/testing';
import { Submission, Task, UserTaskInfo } from '../entity';
import { SubmissionRepo } from '../repo/submission.repo';
import { TaskRepo } from '../repo/task.repo';
import { TaskUC } from './task.uc';

describe('TaskService', () => {
	let service: TaskUC;
	let submissionRepo: SubmissionRepo;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TaskUC,
				TaskRepo,
				{
					provide: TaskRepo,
					useValue: {},
				},
				SubmissionRepo,
				{
					provide: SubmissionRepo,
					useValue: {
						getSubmissionsByTask() {},
					},
				},
			],
		}).compile();

		service = module.get<TaskUC>(TaskUC);
		submissionRepo = module.get<SubmissionRepo>(SubmissionRepo);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('getTaskSubmissionMetadata', () => {
		it('should return the number of students that submitted', async () => {
			const task = new Task();
			const spy = jest.spyOn(submissionRepo, 'getSubmissionsByTask').mockImplementation(() => {
				return Promise.resolve([
					[
						new Submission({ student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }) }),
						new Submission({ student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'def' }) }),
					],
					2,
				]);
			});

			const result = await service.getTaskSubmissionMetadata(task);
			expect(spy).toHaveBeenCalledWith(task);
			expect(result.submitted).toEqual(2);
		});

		it('should count submissions by the same student only once', async () => {
			const task = new Task();
			const spy = jest.spyOn(submissionRepo, 'getSubmissionsByTask').mockImplementation(() => {
				return Promise.resolve([
					[
						new Submission({ student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }) }),
						new Submission({ student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }) }),
					],
					2,
				]);
			});

			const result = await service.getTaskSubmissionMetadata(task);
			expect(spy).toHaveBeenCalledWith(task);
			expect(result.submitted).toEqual(1);
		});

		it('should return the number of students that could submit');

		it('should return the number of submissions that have been graded');
	});
});
