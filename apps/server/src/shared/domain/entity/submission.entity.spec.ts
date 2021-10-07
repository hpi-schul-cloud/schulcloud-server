import { Collection } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@src/modules/database';
import { userFactory, fileFactory } from '../factory';
import { File } from './file.entity';
import { Submission } from './submission.entity';
import { Task } from './task.entity';

const buildSubmission = () => {
	const user = userFactory.build({ firstName: 'John', lastName: 'Doe' });
	const task = new Task({ name: 'task #1' });
	const submission = new Submission({ student: user, comment: '', task });
	return submission;
};

describe('Submission entity', () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({ imports: [MongoMemoryDatabaseModule.forRoot()] }).compile();
	});

	afterAll(async () => {
		await module.close();
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
		const teacher = userFactory.build({ firstName: 'Carl', lastName: 'Cord' });
		const file = fileFactory.build({ creator: teacher });
		submission.gradeFiles = new Collection<File>(submission, [file]);
		expect(submission.isGraded()).toEqual(true);
	});

	it('should not be graded if none of the grade properties are set', () => {
		const submission = buildSubmission();
		expect(submission.isGraded()).toEqual(false);
	});
});
