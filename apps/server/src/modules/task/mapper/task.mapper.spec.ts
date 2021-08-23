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
	it('should map if parent and fullfilled status', () => {
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
	// parent ja nein
	// status ja nein

	// status includes more keys .. rauswerfen
});
