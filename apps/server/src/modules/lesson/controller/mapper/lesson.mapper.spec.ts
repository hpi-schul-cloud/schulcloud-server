import { MikroORM } from '@mikro-orm/core';
import { submissionFactory } from '@testing/factory/submission.factory';
import { taskFactory } from '@testing/factory/task.factory';
import { userFactory } from '@testing/factory/user.factory';
import { setupEntities } from '@testing/setup-entities';
import { LessonLinkedTaskResponse } from '../dto/lesson-linked-task.response';
import { LessonMapper } from './lesson.mapper';

describe('LessonMapper', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('mapTaskToResponse', () => {
		describe('when mapping task to response', () => {
			const setup = () => {
				const task = taskFactory.buildWithId({
					publicSubmissions: true,
					teamSubmissions: true,
					submissions: submissionFactory.buildListWithId(2),
					finished: userFactory.buildListWithId(2),
				});

				return { task };
			};

			it('should map task to response', () => {
				const { task } = setup();

				const result = LessonMapper.mapTaskToResponse(task);

				expect(result).toEqual<LessonLinkedTaskResponse>({
					name: task.name,
					description: task.description,
					descriptionInputFormat: task.descriptionInputFormat,
					availableDate: task.availableDate,
					dueDate: task.dueDate,
					private: task.private,
					creator: task.creator?.id,
					publicSubmissions: task.publicSubmissions,
					teamSubmissions: task.teamSubmissions,
					courseId: task.course?.id,
					submissionIds: task.submissions.toArray().map((submission) => submission.id),
					finishedIds: task.finished.toArray().map((submission) => submission.id),
				});
			});
		});
	});
});
