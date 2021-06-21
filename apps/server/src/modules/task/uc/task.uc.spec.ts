import { Test, TestingModule } from '@nestjs/testing';
import { PaginationQuery } from '@shared/controller/dto/pagination.query';
import { FileTaskInfo, Submission, Task, UserTaskInfo, CourseTaskInfo } from '../entity';
import { SubmissionRepo } from '../repo/submission.repo';
import { TaskRepo } from '../repo/task.repo';
import { TaskUC, computeSubmissionMetadata } from './task.uc';

describe('TaskService', () => {
	let service: TaskUC;
	let taskRepo: TaskRepo;
	// let submissionRepo: SubmissionRepo;

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
		// submissionRepo = module.get<SubmissionRepo>(SubmissionRepo);
		taskRepo = module.get<TaskRepo>(TaskRepo);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('tempFindAllOpenByTeacher', () => {
		it('should return task with statistics', async () => {
			const course1 = new CourseTaskInfo({});
			course1.teachers.add(new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }));

			const course2 = new CourseTaskInfo({});
			course1.teachers.add(new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }));

			const spy = jest.spyOn(taskRepo, 'findAllAssignedByTeacher').mockImplementation(() => {
				return Promise.resolve([[new Task({ course: course1 }), new Task({ course: course2 })], 2]);
			});

			const [tasks, total] = await service.tempFindAllOpenByTeacher('abc', new PaginationQuery());
			expect(total).toEqual(2);
			expect(tasks.length).toEqual(2);
			expect(Object.keys(tasks[0].status)).toEqual(['submitted', 'maxSubmissions', 'graded'].sort());
		});

		// teacher only --> should not needed
	});

	describe('getTaskSubmissionMetadata', () => {
		it('should return the number of students that submitted', () => {
			const testdata = [
				new Submission({ student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }) }),
				new Submission({ student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'def' }) }),
			];

			const result = computeSubmissionMetadata(testdata);
			expect(result.submitted).toEqual(2);
		});

		it('should count submissions by the same student only once', () => {
			const testdata = [
				new Submission({ student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }) }),
				new Submission({ student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }) }),
			];

			const result = computeSubmissionMetadata(testdata);
			expect(result.submitted).toEqual(1);
		});

		it.todo('should return the number of students that could submit');

		it('should return the number of submissions that have been graded', async () => {
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

			const result = computeSubmissionMetadata(testdata);
			expect(result.graded).toEqual(2);
		});
	});
});
