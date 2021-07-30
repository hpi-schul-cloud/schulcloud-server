import { Test } from '@nestjs/testing';
import { CourseTaskInfo, Submission, Task, UserTaskInfo } from '../entity';
import { TaskSubmissionMetadataService } from './task-submission-metadata.service';

describe('taskSubmissionMetadataService', () => {
	let service: TaskSubmissionMetadataService;
	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [TaskSubmissionMetadataService],
		}).compile();

		service = module.get<TaskSubmissionMetadataService>(TaskSubmissionMetadataService);
	});

	describe('submissionStatusForTeacher', () => {
		it('should return the number of students that submitted', () => {
			const task = new Task({ course: new CourseTaskInfo({}) });
			const testdata = [
				new Submission({
					task,
					student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }),
				}),
				new Submission({
					task,
					student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'def' }),
				}),
			];

			const result = service.submissionStatusForTask(testdata, task);
			expect(result.submitted).toEqual(2);
		});

		it('should count submissions by the same student only once', () => {
			const task = new Task({ course: new CourseTaskInfo({}) });
			const testdata = [
				new Submission({
					task,
					student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }),
				}),
				new Submission({
					task,
					student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }),
				}),
			];

			const result = service.submissionStatusForTask(testdata, task);
			expect(result.submitted).toEqual(1);
		});

		it('should return the maximum number of students that could submit', () => {
			const task = { name: 'name', course: { students: [{ id: 'abc' }, { id: 'def' }] } } as unknown;

			const result = service.submissionStatusForTask([], task as Task);
			expect(result.maxSubmissions).toEqual(2);
		});

		it('should return the number of submissions that have been graded', () => {
			const task = new Task({ course: new CourseTaskInfo({}) });
			const testdata = [
				new Submission({
					task,
					student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }),
					grade: 50,
				}),
				new Submission({
					task,
					student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'def' }),
					gradeComment: 'well done',
				}),
				// TODO: add grade file case
				/* new Submission({
							student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'def' }),
							gradeFileIds: [new FileTaskInfo({})],
						}), */
				new Submission({
					task,
					student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'def' }),
				}),
			];

			const result = service.submissionStatusForTask(testdata, task);
			expect(result.graded).toEqual(2);
		});

		it('should consider only the newest submission per user for grading', () => {
			const task = new Task({ course: new CourseTaskInfo({}) });
			const testdata = [
				new Submission({
					task,
					student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }),
					createdAt: new Date(Date.now()),
				}),
				new Submission({
					task,
					student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }),
					gradeComment: 'well done',
					createdAt: new Date(Date.now() - 500),
				}),
			];

			const result = service.submissionStatusForTask(testdata, task);
			expect(result.graded).toEqual(1);
		});

		it('should only consider submissions of the actual task', () => {
			const task = new Task({ id: '123', course: new CourseTaskInfo({}) });
			const differentTask = new Task({ id: '456', course: new CourseTaskInfo({}) });
			const testdata = [
				new Submission({
					task,
					student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }),
				}),
				new Submission({
					task: differentTask,
					student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'efd' }),
				}),
			];

			const result = service.submissionStatusForTask(testdata, task);
			expect(result.submitted).toEqual(1);
		});
	});
});
