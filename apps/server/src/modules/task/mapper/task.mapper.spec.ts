import { Task } from '@shared/domain';
import { taskFactory, setupEntities } from '@shared/testing';
import { TaskResponse } from '../controller/dto';

import { TaskMapper } from './task.mapper';

const createExpectedResponse = (
	task: Task,
	status: { graded: number; maxSubmissions: number; submitted: number; isDraft: boolean },
	parent?: { name: string; color: string; description: string }
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
		expected.description = parent.description;
	}

	return expected;
};

describe('task.mapper', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	it('should map if course and fullfilled status exist', () => {
		const task = taskFactory.private(false).build();
		const taskDescriptions = task.getDescriptions();

		const status = {
			graded: 0,
			maxSubmissions: 0,
			submitted: 0,
			isDraft: false,
		};

		const result = TaskMapper.mapToResponse({ task, status });
		const expected = createExpectedResponse(task, status, taskDescriptions);

		expect(result).toStrictEqual(expected);
	});

	it('should filter unnecessary information from status', () => {
		const task = taskFactory.private(false).build();
		const taskDescriptions = task.getDescriptions();

		const status = {
			graded: 0,
			maxSubmissions: 0,
			submitted: 0,
			isDraft: false,
			additionalKey: '123',
		};

		const result = TaskMapper.mapToResponse({ task, status });
		const expected = createExpectedResponse(task, status, taskDescriptions);

		expect(result).toStrictEqual(expected);
	});

	it('should filter not necessary informations from task', () => {
		const task = taskFactory.private(false).build();
		// @ts-expect-error test-case
		task.key = 1;

		const taskDescriptions = task.getDescriptions();

		const status = {
			graded: 0,
			maxSubmissions: 0,
			submitted: 0,
			isDraft: false,
		};

		const result = TaskMapper.mapToResponse({ task, status });
		const expected = createExpectedResponse(task, status, taskDescriptions);

		expect(result).toStrictEqual(expected);
	});

	it('should set default course information if it does not exist in task.', () => {
		// task has no course
		const task = taskFactory.build();
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
