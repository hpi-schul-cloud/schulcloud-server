import { Test, TestingModule } from '@nestjs/testing';
import { PaginationQuery } from '@shared/controller/dto/pagination.query';
import { ObjectId } from '@mikro-orm/mongodb';
import { FileTaskInfo, Submission, Task, UserTaskInfo, CourseTaskInfo } from '../entity';
import { SubmissionRepo } from '../repo/submission.repo';
import { Counted } from '../../../shared/domain';
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

	/* describe('tempFindAllOpenByTeacher', () => {
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
	}); */

	describe('getTaskSubmissionMetadata', () => {
		it('should return the number of students that submitted', () => {
			const task = new Task({ course: new CourseTaskInfo({}) });
			const testdata = [
				new Submission({ student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }) }),
				new Submission({ student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'def' }) }),
			];

			const result = computeSubmissionMetadata(testdata, task);
			expect(result.submitted).toEqual(2);
		});

		it('should count submissions by the same student only once', () => {
			const task = new Task({ course: new CourseTaskInfo({}) });
			const testdata = [
				new Submission({ student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }) }),
				new Submission({ student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }) }),
			];

			const result = computeSubmissionMetadata(testdata, task);
			expect(result.submitted).toEqual(1);
		});

		/* it.skip('should return the maximum number of students that could submit', () => {
			const students = [
				new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname' }),
				new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname' }),
			];

			const course = new CourseTaskInfo({
				name: 'examplecourse',
				color: '#000000',
				_id: new ObjectId(),
				id: 'ced',
				createdAt: new Date(Date.now()),
				students: new Collection(CourseTaskInfo),
			});

			const task = new Task({ course });

			const result = computeSubmissionMetadata([], task);
			expect(result.maxSubmissions).toEqual(2);
		}); */

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

			const result = computeSubmissionMetadata(testdata, task);
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

			const result = computeSubmissionMetadata(testdata, task);
			expect(result.graded).toEqual(1);
		});
	});
});
