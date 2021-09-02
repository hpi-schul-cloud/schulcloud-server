import { Collection } from '@mikro-orm/core';

import { TaskTestHelper } from '../utils/TestHelper';
import { UserTaskInfo, FileTaskInfo, Submission } from '../entity';

import { StatusDomainService } from './StatusDomainService';

const addGradedFileCollectionWithFileToSubmission = (submission: Submission, creator: UserTaskInfo): FileTaskInfo => {
	const file = new FileTaskInfo({ name: '', creator });
	const collection = new Collection<FileTaskInfo>(submission, [file]);
	submission.gradeFiles = collection;
	return file;
};

describe('StatusDomainService', () => {
	describe('submissionStatusForTeacher', () => {
		it('should return task and status', () => {
			const helper = new TaskTestHelper();
			helper.createAndAddUser();
			const task = helper.createTask();
			const submissions = helper.createSubmissionsForEachStudent(task);

			const domain = new StatusDomainService(submissions);
			const result = domain.addStatusToTask(task, 2);
			expect(result.task).toEqual(task);
			expect(result.status).toBeDefined();
		});

		it('should include graded, submitted and maxSubmissions in status', () => {
			const helper = new TaskTestHelper();
			helper.createAndAddUser();
			const task = helper.createTask();
			const submissions = helper.createSubmissionsForEachStudent(task);

			const domain = new StatusDomainService(submissions);
			const result = domain.addStatusToTask(task, 2);
			expect(result.status.graded).toBeDefined();
			expect(result.status.submitted).toBeDefined();
			expect(result.status.maxSubmissions).toBeDefined();
		});

		it('should return the number of students that submitted', () => {
			const helper = new TaskTestHelper();
			helper.createAndAddUser();
			const task = helper.createTask();
			const submissions = helper.createSubmissionsForEachStudent(task);

			const domain = new StatusDomainService(submissions);
			const result = domain.addStatusToTask(task, 2);
			expect(result.status.submitted).toEqual(2);
		});

		it('should count submissions by the same student only once', () => {
			const helper = new TaskTestHelper();
			const task = helper.createTask();
			const submissions = [helper.createSubmission(task), helper.createSubmission(task)];

			const domain = new StatusDomainService(submissions);
			const result = domain.addStatusToTask(task, 1);
			expect(result.status.submitted).toEqual(1);
		});

		it('should return the maximum number of students that could submit', () => {
			const helper = new TaskTestHelper();
			const task = helper.createTask();

			const domain = new StatusDomainService([]);
			const result = domain.addStatusToTask(task, 3);
			expect(result.status.maxSubmissions).toEqual(3);
		});

		it('should count graded number.', () => {
			const helper = new TaskTestHelper();
			helper.createAndAddUser();
			const task = helper.createTask();
			const submissions = helper.createSubmissionsForEachStudent(task);

			submissions[0].grade = 50;
			// submissions[1] has no grade

			const domain = new StatusDomainService(submissions);
			const result = domain.addStatusToTask(task, 2);
			expect(result.status.graded).toEqual(1);
		});

		it('should count graded comment.', () => {
			const helper = new TaskTestHelper();
			helper.createAndAddUser();
			const task = helper.createTask();
			const submissions = helper.createSubmissionsForEachStudent(task);

			submissions[0].gradeComment = 'well done';
			// submissions[1] has no grade

			const domain = new StatusDomainService(submissions);
			const result = domain.addStatusToTask(task, 2);
			expect(result.status.graded).toEqual(1);
		});

		it('should count graded files.', () => {
			const helper = new TaskTestHelper();
			helper.createAndAddUser();
			const task = helper.createTask();
			const submissions = helper.createSubmissionsForEachStudent(task);

			addGradedFileCollectionWithFileToSubmission(submissions[0], helper.getFirstUser() as UserTaskInfo);
			// submissions[1] has no grade

			const domain = new StatusDomainService(submissions);
			const result = domain.addStatusToTask(task, 2);
			expect(result.status.graded).toEqual(1);
		});

		it('should return the number of submissions that have been graded', () => {
			const helper = new TaskTestHelper();
			helper.createAndAddUser();
			helper.createAndAddUser();
			helper.createAndAddUser();
			const task = helper.createTask();
			const submissions = helper.createSubmissionsForEachStudent(task);

			submissions[0].grade = 50;
			submissions[1].gradeComment = 'well done';
			addGradedFileCollectionWithFileToSubmission(submissions[2], helper.getFirstUser() as UserTaskInfo);
			// submissions[3] has no grade

			const domain = new StatusDomainService(submissions);
			const result = domain.addStatusToTask(task, 4);
			expect(result.status.graded).toEqual(3);
		});

		it('should consider only the newest submission per user for grading', () => {
			const helper = new TaskTestHelper();
			const task = helper.createTask();

			const submission1 = helper.createSubmission(task);
			submission1.createdAt = new Date(Date.now() - 1800000);

			const submission2 = helper.createSubmission(task);
			submission2.createdAt = new Date(Date.now());

			const submission3 = helper.createSubmission(task);
			submission3.createdAt = new Date(Date.now() - 3600000);

			const submissions = [submission1, submission2, submission3];

			const domain = new StatusDomainService(submissions);
			const result = domain.addStatusToTask(task, 1);
			expect(result.status.graded).toEqual(0);
		});

		it('should only consider submissions of the actual task', () => {
			const helper = new TaskTestHelper();
			const task = helper.createTask();
			const otherTask = helper.createTask();

			const submission = helper.createSubmission(task);
			const otherSubmission = helper.createSubmission(otherTask);

			const submissions = [submission, otherSubmission];

			const domain = new StatusDomainService(submissions);
			const result = domain.addStatusToTask(task, 1);
			expect(result.status.submitted).toEqual(1);
		});
	});
});
