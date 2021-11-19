import { Task, ITaskStatus } from '@shared/domain';
import { taskFactory, courseFactory, lessonFactory, setupEntities } from '@shared/testing';
import { TaskResponse, FinishedTaskReponse } from '../controller/dto';

import { TaskMapper } from './task.mapper';

const createExpectedResponse = (task: Task, status: ITaskStatus): TaskResponse => {
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
		isSubstitutionTeacher: status.isSubstitutionTeacher,
	};

	const parent = task.getDescriptions();
	expected.courseName = parent.name;
	expected.displayColor = parent.color;
	expected.description = parent.description;

	return expected;
};

const createExpectedFinishedResponse = (task: Task): FinishedTaskReponse => {
	const expected = new FinishedTaskReponse();
	expected.id = task.id;
	expected.name = task.name;
	expected.availableDate = task.availableDate;
	expected.duedate = task.dueDate;
	expected.createdAt = task.createdAt;
	expected.updatedAt = task.updatedAt;

	const parent = task.getDescriptions();
	expected.courseName = parent.name;
	expected.displayColor = parent.color;
	expected.description = parent.description;

	return expected;
};

describe('task.mapper', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('mapToFinishedResponse', () => {
		it('should map task with course and lesson', () => {
			const course = courseFactory.buildWithId();
			const lesson = lessonFactory.buildWithId({ course });
			const task = taskFactory.buildWithId({ lesson, course });

			const result = TaskMapper.mapToFinishedResponse(task);
			const expected = createExpectedFinishedResponse(task);

			expect(result).toStrictEqual(expected);
		});

		it('should map task with course', () => {
			const course = courseFactory.buildWithId();
			const task = taskFactory.buildWithId({ course });

			const result = TaskMapper.mapToFinishedResponse(task);
			const expected = createExpectedFinishedResponse(task);

			expect(result).toStrictEqual(expected);
		});

		it('should map task without course', () => {
			const task = taskFactory.buildWithId();

			const result = TaskMapper.mapToFinishedResponse(task);
			const expected = createExpectedFinishedResponse(task);

			expect(result).toStrictEqual(expected);
		});
	});

	describe('mapToResponse', () => {
		it('should map task with course and lesson', () => {
			const course = courseFactory.buildWithId();
			const lesson = lessonFactory.buildWithId({ course });
			const task = taskFactory.buildWithId({ lesson, course });

			const status = {
				graded: 0,
				maxSubmissions: 0,
				submitted: 0,
				isDraft: false,
				isSubstitutionTeacher: false,
			};

			const result = TaskMapper.mapToResponse({ task, status });
			const expected = createExpectedResponse(task, status);

			expect(result).toStrictEqual(expected);
		});

		it('should map task with course', () => {
			const course = courseFactory.buildWithId();
			const task = taskFactory.buildWithId({ course });

			const status = {
				graded: 0,
				maxSubmissions: 0,
				submitted: 0,
				isDraft: false,
				isSubstitutionTeacher: false,
			};

			const result = TaskMapper.mapToResponse({ task, status });
			const expected = createExpectedResponse(task, status);

			expect(result).toStrictEqual(expected);
		});

		it('should map task without course', () => {
			const task = taskFactory.buildWithId();

			const status = {
				graded: 0,
				maxSubmissions: 0,
				submitted: 0,
				isDraft: false,
				isSubstitutionTeacher: false,
			};

			const result = TaskMapper.mapToResponse({ task, status });
			const expected = createExpectedResponse(task, status);

			expect(result).toStrictEqual(expected);
		});
	});
});
