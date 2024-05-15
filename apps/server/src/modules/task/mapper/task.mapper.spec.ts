import { ObjectId } from '@mikro-orm/mongodb';
import { Task, TaskParentDescriptions } from '@shared/domain/entity';
import { InputFormat, TaskStatus, TaskUpdate } from '@shared/domain/types';
import { setupEntities, taskFactory } from '@shared/testing/factory';
import { TaskCreateParams, TaskResponse, TaskStatusResponse, TaskUpdateParams } from '../controller/dto';
import { TaskMapper } from './task.mapper';

const createExpectedResponse = (task: Task, status: TaskStatus, descriptions: TaskParentDescriptions): TaskResponse => {
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
	expected.dueDate = task.dueDate;
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
	beforeAll(async () => {
		await setupEntities();
	});

	describe('mapToResponse', () => {
		it('should map task with status and description values', () => {
			const task = taskFactory.buildWithId({ availableDate: new Date(), dueDate: new Date() });

			const descriptions: TaskParentDescriptions = {
				courseName: 'course #1',
				courseId: 'course ID #1',
				color: '#F0F0F0',
				lessonName: 'a task description',
				lessonHidden: false,
			};

			const spyParent = jest.spyOn(task, 'getParentData').mockReturnValue(descriptions);

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

			expect(spyParent).toHaveBeenCalled();
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

			const expected: TaskUpdate = {
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

			const expected: TaskUpdate = {
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
