import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { ITaskStatus, ITaskUpdate, Task, TaskParentDescriptions } from '@shared/domain';
import { setupEntities, taskFactory } from '@shared/testing';
import { TaskResponse, TaskStatusResponse, TaskUpdateParams } from '../controller/dto';
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
	expected.courseId = descriptions.courseId;
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
				courseId: 'course ID #1',
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

	describe('mapUpdateTaskToDomain', () => {
		it('should correctly map params to dto', () => {
			const params: TaskUpdateParams = {
				name: 'test name',
				courseId: new ObjectId().toHexString(),
			};
			const result = TaskMapper.mapUpdateTaskToDomain(params);

			const expected: ITaskUpdate = {
				name: params.name,
				courseId: params.courseId,
				lessonId: params.lessonId,
			};
			expect(result).toStrictEqual(expected);
		});
	});
});
