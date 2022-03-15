import { Collection } from '@mikro-orm/core';
import { userFactory, taskFactory, submissionFactory, fileFactory, setupEntities } from '@shared/testing';
import { File } from './file.entity';

describe('Submission entity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		it('should set student files', () => {
			const files = fileFactory.buildList(3);
			const submission = submissionFactory.build({ studentFiles: files });
			expect(submission.studentFiles).toBeDefined();
		});

		it('should set grade files', () => {
			const files = fileFactory.buildList(3);
			const submission = submissionFactory.build({ gradeFiles: files });
			expect(submission.gradeFiles).toBeDefined();
		});
	});

	describe('isGraded', () => {
		it('should be graded if grade percentage is set', () => {
			const student = userFactory.build();
			const task = taskFactory.build();
			const submission = submissionFactory.build({ task, student, grade: 50 });

			expect(submission.isGraded()).toEqual(true);
		});

		it('should be graded if grade comment is set', () => {
			const student = userFactory.build();
			const task = taskFactory.build();
			const submission = submissionFactory.build({ task, student, gradeComment: 'well done!' });

			expect(submission.isGraded()).toEqual(true);
		});

		it('should be graded if grade grade files have been associated', () => {
			const student = userFactory.build();
			const task = taskFactory.build();
			const teacher = userFactory.build();
			const file = fileFactory.build({ creator: teacher });
			const submission = submissionFactory.build({ task, student });
			submission.gradeFiles = new Collection<File>(submission, [file]);

			expect(submission.isGraded()).toEqual(true);
		});
	});

	describe('getStudentId', () => {
		it('should return the id of the student', () => {
			const student = userFactory.build();
			student.id = '0123456789ab';
			const task = taskFactory.build();
			const submission = submissionFactory.build({ task, student });

			const result = submission.getStudentId();

			expect(result).toEqual(student.id);
		});
	});
});
