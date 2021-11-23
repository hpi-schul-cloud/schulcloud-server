import { Task } from '@shared/domain';
import { taskFactory, setupEntities } from '@shared/testing';
import { TaskResponse, TaskStatusResponse } from '../controller/dto';

import { TaskMapper } from './task.mapper';

const createExpectedResponse = (
	task: Task,
	status: TaskStatusResponse,
	parent?: { name: string; color: string; description: string }
): TaskResponse => {
	const expectedStatus = Object.create(TaskStatusResponse.prototype) as TaskStatusResponse;
	expectedStatus.graded = status.graded;
	expectedStatus.maxSubmissions = status.maxSubmissions;
	expectedStatus.submitted = status.submitted;
	expectedStatus.isDraft = status.isDraft;
	expectedStatus.isSubstitutionTeacher = status.isSubstitutionTeacher;

	const expected = new TaskResponse({
		id: task.id,
		name: task.name,
		courseName: parent?.name || '',
		createdAt: task.createdAt,
		updatedAt: task.updatedAt,
		status: expectedStatus,
	});
	expected.availableDate = task.availableDate;
	expected.duedate = task.dueDate;

	if (parent !== undefined) {
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
		const task = taskFactory.draft(false).build();
		const taskDescriptions = task.getDescriptions();

		const status = {
			graded: 0,
			maxSubmissions: 0,
			submitted: 0,
			isDraft: false,
			isSubstitutionTeacher: false,
		};

		const result = TaskMapper.mapToResponse({ task, status });
		const expected = createExpectedResponse(task, status, taskDescriptions);

		expect(result).toStrictEqual(expected);
	});

	it('should filter unnecessary information from status', () => {
		const task = taskFactory.draft(false).build();
		const taskDescriptions = task.getDescriptions();

		const status = {
			graded: 0,
			maxSubmissions: 0,
			submitted: 0,
			isDraft: false,
			isSubstitutionTeacher: false,
			additionalKey: '123',
		};

		const result = TaskMapper.mapToResponse({ task, status });
		const expected = createExpectedResponse(task, status, taskDescriptions);

		expect(result).toStrictEqual(expected);
	});

	it('should filter not necessary informations from task', () => {
		const task = taskFactory.draft(false).build();
		// @ts-expect-error test-case
		task.key = 1;

		const taskDescriptions = task.getDescriptions();

		const status = {
			graded: 0,
			maxSubmissions: 0,
			submitted: 0,
			isDraft: false,
			isSubstitutionTeacher: false,
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
			isSubstitutionTeacher: false,
		};

		const result = TaskMapper.mapToResponse({ task, status });
		const expected = createExpectedResponse(task, status, taskDefaultDescriptions);

		expect(result).toStrictEqual(expected);
	});
});
