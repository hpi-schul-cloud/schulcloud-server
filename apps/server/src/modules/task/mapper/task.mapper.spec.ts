import { TaskResponse } from '../controller/dto';
import { Task } from '../entity';

import { TaskTestHelper } from '../utils/TestHelper';

import { TaskMapper } from './task.mapper';

const createExpectedResponse = (
	task: Task,
	status: { graded: number; maxSubmissions: number; submitted: number },
	parent?: { name: string; color: string }
): TaskResponse => {
	const expected = new TaskResponse();
	expected.id = task.id;
	expected.name = task.getName();
	expected.duedate = task.getDueDate();
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
		const helper = new TaskTestHelper();
		const parent = helper.createTaskParent();
		const task = helper.createTask(parent.id);

		task.setParent(parent);
		const parentDescriptions = parent.getDescriptions();
		const maxSubmissions = parent.getStudentsNumber();

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
		const helper = new TaskTestHelper();
		const parent = helper.createTaskParent();
		const task = helper.createTask(parent.id);

		task.setParent(parent);
		const parentDescriptions = parent.getDescriptions();
		const maxSubmissions = parent.getStudentsNumber();

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
		const helper = new TaskTestHelper();
		const parent = helper.createTaskParent();
		const task = helper.createTask(parent.id);
		// @ts-expect-error test-case
		task.key = 1;

		task.setParent(parent);
		const parentDescriptions = parent.getDescriptions();
		const maxSubmissions = parent.getStudentsNumber();

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
		const helper = new TaskTestHelper();
		const parent = helper.createTaskParent();
		const task = helper.createTask(parent.id);

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
