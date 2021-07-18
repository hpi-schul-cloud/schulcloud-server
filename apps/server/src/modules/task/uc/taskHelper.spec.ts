import { Submission, UserTaskInfo } from '../entity';
import { TaskHelper } from './taskHelper';

describe('TaskService', () => {
	it('should be defined', () => {
		expect(typeof TaskHelper.computeSubmissionStatus).toBe('function');
		expect(typeof TaskHelper.calculateDateFilterForOpenTask).toBe('function');
		expect(typeof TaskHelper.computedTasksBySubmissions).toBe('function');
	});

	describe('computeSubmissionStatus', () => {
		it('should return the number of students that submitted', () => {
			const testdata = [
				new Submission({ student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }) }),
				new Submission({ student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'def' }) }),
			];

			const result = TaskHelper.computeSubmissionStatus(testdata);
			expect(result.submitted).toEqual(2);
		});

		it('should count submissions by the same student only once', () => {
			const testdata = [
				new Submission({ student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }) }),
				new Submission({ student: new UserTaskInfo({ firstName: 'firstname', lastName: 'lastname', id: 'abc' }) }),
			];

			const result = TaskHelper.computeSubmissionStatus(testdata);
			expect(result.submitted).toEqual(1);
		});

		it('should return the passed number as value for maxSubmissions', () => {
			const result = TaskHelper.computeSubmissionStatus([], 10);
			expect(result.maxSubmissions).toEqual(10);
		});

		it('should return the number of submissions that have been graded', () => {
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

			const result = TaskHelper.computeSubmissionStatus(testdata);
			expect(result.graded).toEqual(2);
		});

		it('should consider only the newest submission per user for grading', () => {
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

			const result = TaskHelper.computeSubmissionStatus(testdata);
			expect(result.graded).toEqual(1);
		});
	});
});
