import { ObjectId } from '@mikro-orm/mongodb';
import { Course } from '@src/entities';
import { TaskResponse } from '../controller/dto';
import { Task } from '../entity';

import { TaskMapper } from './task.mapper';

const createExpectedResponse = (
	task: Task,
	status: { graded: number; maxSubmissions: number; submitted: number },
	parent?: { name: string; color: string }
): TaskResponse => {
	const expected = new TaskResponse();
	expected.id = task.id;
	expected.name = task.name;
	expected.duedate = task.dueDate;
	expected.createdAt = task.createdAt;
	expected.updatedAt = task.updatedAt;
	expected.status = {
		graded: status.graded,
		maxSubmissions: status.maxSubmissions,
		submitted: status.submitted,
	};
	if (parent !== undefined) {
		expected.courseName = parent.name;
		expected.displayColor = parent.color;
	}

	return expected;
};

describe('task.mapper', () => {
	it('should map if parent and fullfilled status exist', () => {
		const parent = new Course({
			name: 'course #1',
			schoolId: new ObjectId(),
			description: 'a short description for course #1',
		});
		const task = new Task({ name: 'task #1', private: false, parent });
		const parentDescriptions = parent.getDescriptions();
		const maxSubmissions = parent.getNumberOfStudents();

		const status = {
			graded: 0,
			maxSubmissions,
			submitted: 0,
		};

		const result = TaskMapper.mapToResponse({ task, status });
		const expected = createExpectedResponse(task, status, parentDescriptions);

		expect(result).toStrictEqual(expected);
	});

	it('should filter not necessary informations from status', () => {
		const parent = new Course({
			name: 'course #1',
			schoolId: new ObjectId(),
			description: 'a short description for course #1',
		});
		const task = new Task({ name: 'task #1', private: false, parent });
		const parentDescriptions = parent.getDescriptions();
		const maxSubmissions = parent.getNumberOfStudents();

		const status = {
			graded: 0,
			maxSubmissions,
			submitted: 0,
			additionalKey: '123',
		};

		const result = TaskMapper.mapToResponse({ task, status });
		const expected = createExpectedResponse(task, status, parentDescriptions);

		expect(result).toStrictEqual(expected);
	});

	it('should filter not necessary informations from task', () => {
		const parent = new Course({
			name: 'course #1',
			schoolId: new ObjectId(),
			description: 'a short description for course #1',
		});
		const task = new Task({ name: 'task #1', private: false, parent });
		// @ts-expect-error test-case
		task.key = 1;

		const parentDescriptions = parent.getDescriptions();
		const maxSubmissions = parent.getNumberOfStudents();

		const status = {
			graded: 0,
			maxSubmissions,
			submitted: 0,
		};

		const result = TaskMapper.mapToResponse({ task, status });
		const expected = createExpectedResponse(task, status, parentDescriptions);

		expect(result).toStrictEqual(expected);
	});

	it('should not set parent meta informations if it is not exist in task.', () => {
		// task has no parent
		const task = new Task({ name: 'test task#1' });

		const status = {
			graded: 0,
			maxSubmissions: 10,
			submitted: 0,
		};

		const result = TaskMapper.mapToResponse({ task, status });
		const expected = createExpectedResponse(task, status);

		expect(result).toStrictEqual(expected);
	});
});
