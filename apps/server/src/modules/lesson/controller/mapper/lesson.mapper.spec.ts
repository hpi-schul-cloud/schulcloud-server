import { MikroORM } from '@mikro-orm/core';
import { setupEntities, taskFactory } from '@shared/testing';
import { TaskResponse } from '../dto/task.response';
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
				});

				return { task };
			};

			it('should map task to response', () => {
				const { task } = setup();

				const result = LessonMapper.mapTaskToResponse(task);

				expect(result).toEqual<TaskResponse>({
					name: task.name,
					description: task.description,
					descriptionInputFormat: task.descriptionInputFormat,
					availableDate: task.availableDate,
					dueDate: task.dueDate,
					private: task.private,
					creator: task.creator?.id,
					publicSubmissions: task.publicSubmissions,
					teamSubmissions: task.teamSubmissions,
				});
			});
		});
	});
});
