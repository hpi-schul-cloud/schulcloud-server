import { Test } from '@nestjs/testing';
import { Collection } from '@mikro-orm/core';

import { UserTaskInfo, FileTaskInfo } from '../entity';
import { TaskSubmissionMetadataService } from './task-submission-metadata.service';

import { TaskTestHelper } from '../utils/TestHelper';

const createFileCollectionWithFile = (creator: UserTaskInfo): Collection<FileTaskInfo> => {
	return new Collection<FileTaskInfo>([new FileTaskInfo({ name: '', creator })]);
};

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
			const helper = new TaskTestHelper();
			helper.createAndAddUser();
			const task = helper.createTask();
			const submissions = helper.createSubmissionsForEachStudent(task);

			const result = service.submissionStatusForTask(submissions, task, 2);
			expect(result.submitted).toEqual(2);
		});

		it('should count submissions by the same student only once', () => {
			const helper = new TaskTestHelper();
			const task = helper.createTask();
			const submissions = [helper.createSubmission(task), helper.createSubmission(task)];

			const result = service.submissionStatusForTask(submissions, task, 1);
			expect(result.submitted).toEqual(1);
		});

		it('should return the maximum number of students that could submit', () => {
			const helper = new TaskTestHelper();
			const task = helper.createTask();
			const result = service.submissionStatusForTask([], task, 3);
			expect(result.maxSubmissions).toEqual(3);
		});

		it('should count graded number.', () => {
			const helper = new TaskTestHelper();
			helper.createAndAddUser();
			const task = helper.createTask();
			const submissions = helper.createSubmissionsForEachStudent(task);

			submissions[0].grade = 50;
			// submissions[1] has no grade

			const result = service.submissionStatusForTask(submissions, task, 2);
			expect(result.graded).toEqual(1);
		});

		it('should count graded comment.', () => {
			const helper = new TaskTestHelper();
			helper.createAndAddUser();
			const task = helper.createTask();
			const submissions = helper.createSubmissionsForEachStudent(task);

			submissions[0].gradeComment = 'well done';
			// submissions[1] has no grade

			const result = service.submissionStatusForTask(submissions, task, 2);
			expect(result.graded).toEqual(1);
		});

		it('should count graded files.', () => {
			const helper = new TaskTestHelper();
			helper.createAndAddUser();
			const task = helper.createTask();
			const submissions = helper.createSubmissionsForEachStudent(task);

			submissions[0].gradeFile = createFileCollectionWithFile(helper.getFirstUser());
			// submissions[1] has no grade

			const result = service.submissionStatusForTask(submissions, task, 2);
			expect(result.graded).toEqual(1);
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
			submissions[2].gradeFile = createFileCollectionWithFile(helper.getUsers()[2]);
			// submissions[3] has no grade

			const result = service.submissionStatusForTask(submissions, task, 4);
			expect(result.graded).toEqual(3);
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

			const result = service.submissionStatusForTask(submissions, task, 1);
			expect(result.graded).toEqual(0);
		});

		it('should only consider submissions of the actual task', () => {
			const helper = new TaskTestHelper();
			const task = helper.createTask();
			const otherTask = helper.createTask();

			const submission = helper.createSubmission(task);
			const otherSubmission = helper.createSubmission(otherTask);

			const submissions = [submission, otherSubmission];

			const result = service.submissionStatusForTask(submissions, task, 1);
			expect(result.submitted).toEqual(1);
		});
	});
});
