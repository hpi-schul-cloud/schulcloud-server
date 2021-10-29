import { Collection } from '@mikro-orm/core';
import { userFactory, taskFactory, submissionFactory, fileFactory, setupEntities } from '@shared/testing';
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

	describe('isGraded', () => {
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
	});

	describe('getStudentId', () => {
		it('should return the id of the student that upload the submission', () => {});
	});
});
