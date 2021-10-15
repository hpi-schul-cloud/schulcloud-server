import { Test, TestingModule } from '@nestjs/testing';
import { Course, Task, School } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@src/modules/database';
import { TaskResponse } from '../controller/dto';

import { TaskMapper } from './task.mapper';

const createExpectedResponse = (
	task: Task,
	status: { graded: number; maxSubmissions: number; submitted: number; isDraft: boolean },
	parent?: { name: string; color: string }
): TaskResponse => {
	const expected = new TaskResponse();
	expected.id = task.id;
	expected.name = task.name;
	expected.availableDate = task.availableDate;
	expected.duedate = task.dueDate;
	expected.createdAt = task.createdAt;
	expected.updatedAt = task.updatedAt;
	expected.status = {
		graded: status.graded,
		maxSubmissions: status.maxSubmissions,
		submitted: status.submitted,
		isDraft: status.isDraft,
	};
	if (parent !== undefined) {
		expected.courseName = parent.name;
		expected.displayColor = parent.color;
	}

	return expected;
};

describe('task.mapper', () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
		}).compile();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should map if course and fullfilled status exist', () => {
		const course = new Course({
			name: 'course #1',
			school: new School({ name: 'school #1' }),
			description: 'a short description for course #1',
		});
		const task = new Task({ name: 'task #1', private: false, course });
		const taskDescriptions = task.getDescriptions();
		const maxSubmissions = course.getNumberOfStudents();

		const status = {
			graded: 0,
			maxSubmissions,
			submitted: 0,
			isDraft: false,
		};

		const result = TaskMapper.mapToResponse({ task, status });
		const expected = createExpectedResponse(task, status, taskDescriptions);

		expect(result).toStrictEqual(expected);
	});

	it('should filter unnecessary information from status', () => {
		const course = new Course({
			name: 'course #1',
			school: new School({ name: 'school #1' }),
			description: 'a short description for course #1',
		});
		const task = new Task({ name: 'task #1', private: false, course });
		const taskDescriptions = task.getDescriptions();
		const maxSubmissions = course.getNumberOfStudents();

		const status = {
			graded: 0,
			maxSubmissions,
			submitted: 0,
			isDraft: false,
			additionalKey: '123',
		};

		const result = TaskMapper.mapToResponse({ task, status });
		const expected = createExpectedResponse(task, status, taskDescriptions);

		expect(result).toStrictEqual(expected);
	});

	it('should filter not necessary informations from task', () => {
		const course = new Course({
			name: 'course #1',
			school: new School({ name: 'school #1' }),
			description: 'a short description for course #1',
		});
		const task = new Task({ name: 'task #1', private: false, course });
		// @ts-expect-error test-case
		task.key = 1;

		const taskDescriptions = task.getDescriptions();
		const maxSubmissions = course.getNumberOfStudents();

		const status = {
			graded: 0,
			maxSubmissions,
			submitted: 0,
			isDraft: false,
		};

		const result = TaskMapper.mapToResponse({ task, status });
		const expected = createExpectedResponse(task, status, taskDescriptions);

		expect(result).toStrictEqual(expected);
	});

	it('should set default course information if it does not exist in task.', () => {
		// task has no course
		const task = new Task({ name: 'task #1' });
		const taskDefaultDescriptions = {
			name: '',
			description: '',
			color: '#ACACAC',
		};

		const status = {
			graded: 0,
			maxSubmissions: 10,
			submitted: 0,
			isDraft: false,
		};

		const result = TaskMapper.mapToResponse({ task, status });
		const expected = createExpectedResponse(task, status, taskDefaultDescriptions);

		expect(result).toStrictEqual(expected);
	});
});
