import { Collection } from '@mikro-orm/core';
import { setupEntities } from '@src/modules/database';
import { userFactory, taskFactory, submissionFactory, fileFactory } from '../factory';
import { File } from './file.entity';

const buildSubmission = () => {
	const student = userFactory.build();
	const task = taskFactory.build();
	const submission = submissionFactory.build({ task, student });
	return submission;
};

describe('Submission entity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	it('should be graded if grade percentage is set', () => {
		const submission = buildSubmission();
		submission.grade = 50;
		expect(submission.isGraded()).toEqual(true);
	});

	it('should be graded if grade comment is set', () => {
		const submission = buildSubmission();
		submission.gradeComment = 'well done!';
		expect(submission.isGraded()).toEqual(true);
	});

	it('should be graded if grade grade files have been associated', () => {
		const submission = buildSubmission();
		const teacher = userFactory.build();
		const file = fileFactory.build({ creator: teacher });
		submission.gradeFiles = new Collection<File>(submission, [file]);
		expect(submission.isGraded()).toEqual(true);
	});

	it('should not be graded if none of the grade properties are set', () => {
		const submission = buildSubmission();
		expect(submission.isGraded()).toEqual(false);
	});
});
