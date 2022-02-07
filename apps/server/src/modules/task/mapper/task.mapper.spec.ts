import { MikroORM } from '@mikro-orm/core';
import { Task, ITaskStatus, TaskParentDescriptions } from '@shared/domain';
import { taskFactory, setupEntities } from '@shared/testing';
import { TaskResponse, TaskStatusResponse } from '../controller/dto';

import { TaskMapper } from './task.mapper';

const createExpectedResponse = (
	task: Task,
	status: ITaskStatus,
	descriptions: TaskParentDescriptions
): TaskResponse => {
	const expectedStatus = Object.create(TaskStatusResponse.prototype) as TaskStatusResponse;
	expectedStatus.graded = status.graded;
	expectedStatus.maxSubmissions = status.maxSubmissions;
	expectedStatus.submitted = status.submitted;
	expectedStatus.isDraft = status.isDraft;
	expectedStatus.isFinished = status.isFinished;
	expectedStatus.isSubstitutionTeacher = status.isSubstitutionTeacher;

	const expected = Object.create(TaskResponse.prototype) as TaskResponse;
	expected.id = task.id;
	expected.name = task.name;
	expected.availableDate = task.availableDate;
	expected.duedate = task.dueDate;
	expected.createdAt = task.createdAt;
	expected.updatedAt = task.updatedAt;
	expected.status = expectedStatus;

	expected.courseName = descriptions.courseName;
	expected.displayColor = descriptions.color;
	expected.description = descriptions.lessonName;

	return expected;
};

describe('task.mapper', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('mapToResponse', () => {
		it('should map task with status and description values', () => {
			const task = taskFactory.buildWithId({ availableDate: new Date(), dueDate: new Date() });

			const descriptions: TaskParentDescriptions = {
				courseName: 'course #1',
				color: '#F0F0F0',
				lessonName: 'a task description',
			};

			const spy = jest.spyOn(task, 'getParentData').mockReturnValue(descriptions);

			const status = {
				graded: 0,
				maxSubmissions: 0,
				submitted: 0,
				isDraft: false,
				isFinished: false,
				isSubstitutionTeacher: false,
			};

			const result = TaskMapper.mapToResponse({ task, status });
			const expected = createExpectedResponse(task, status, descriptions);

			expect(spy).toHaveBeenCalled();
			expect(result).toStrictEqual(expected);
		});
	});
});
