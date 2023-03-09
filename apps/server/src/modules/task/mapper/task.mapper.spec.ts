import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { InputFormat, ITaskStatus, ITaskUpdate, Task, TaskParentDescriptions } from '@shared/domain';
import { setupEntities, taskFactory } from '@shared/testing';
import { TaskCreateParams, TaskResponse, TaskStatusResponse, TaskUpdateParams } from '../controller/dto';
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
	expected.createdAt = task.createdAt;
	if (task.description) {
		expected.description = {
			content: task.description,
			type: task.descriptionInputFormat || InputFormat.RICH_TEXT_CK4,
		};
	}
	if (task.taskCard) {
		expected.taskCardId = task.taskCard;
	}
	expected.duedate = task.dueDate;
	expected.updatedAt = task.updatedAt;
	expected.status = expectedStatus;

	expected.courseName = descriptions.courseName;
	expected.courseId = descriptions.courseId;
	expected.displayColor = descriptions.color;
	expected.lessonName = descriptions.lessonName;
	expected.lessonHidden = descriptions.lessonHidden;

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
		it('should map task with status, task card and description values', () => {
			const task = taskFactory.buildWithId({ availableDate: new Date(), dueDate: new Date() });
			task.taskCard = 'task card ID #1';

			const descriptions: TaskParentDescriptions = {
				courseName: 'course #1',
				courseId: 'course ID #1',
				color: '#F0F0F0',
				lessonName: 'a task description',
				lessonHidden: false,
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

	describe('mapTaskUpdateToDomain', () => {
		it('should correctly map params to dto', () => {
			const params: TaskUpdateParams = {
				name: 'test name',
				courseId: new ObjectId().toHexString(),
				description: 'test',
				dueDate: new Date('2023-05-28T08:00:00.000+00:00'),
				availableDate: new Date('2022-05-28T08:00:00.000+00:00'),
			};
			const result = TaskMapper.mapTaskUpdateToDomain(params);

			const expected: ITaskUpdate = {
				name: params.name,
				courseId: params.courseId,
				lessonId: params.lessonId,
				description: params.description,
				descriptionInputFormat: InputFormat.RICH_TEXT_CK5,
				dueDate: params.dueDate,
				availableDate: params.availableDate,
			};
			expect(result).toStrictEqual(expected);
		});
	});

	describe('mapTaskCreateToDomain', () => {
		it('should correctly map params to dto', () => {
			const params: TaskCreateParams = {
				name: 'test name',
				courseId: new ObjectId().toHexString(),
				description: 'test',
				dueDate: new Date('2023-05-28T08:00:00.000+00:00'),
				availableDate: new Date('2022-05-28T08:00:00.000+00:00'),
			};
			const result = TaskMapper.mapTaskCreateToDomain(params);

			const expected: ITaskUpdate = {
				name: params.name,
				courseId: params.courseId,
				lessonId: params.lessonId,
				description: params.description,
				descriptionInputFormat: InputFormat.RICH_TEXT_CK5,
				dueDate: params.dueDate,
				availableDate: params.availableDate,
			};
			expect(result).toStrictEqual(expected);
		});
	});
});
