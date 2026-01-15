import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { TaskService } from '@modules/task';
import { Submission, Task } from '@modules/task/repo';
import { taskFactory } from '@modules/task/testing';
import { User } from '@modules/user/repo';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { ObjectId } from '@mikro-orm/mongodb';
import { MetaDataEntityType } from '../../types';
import { TaskUrlHandler } from './task-url-handler';

describe(TaskUrlHandler.name, () => {
	let module: TestingModule;
	let taskService: DeepMocked<TaskService>;
	let taskUrlHandler: TaskUrlHandler;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TaskUrlHandler,
				{
					provide: TaskService,
					useValue: createMock<TaskService>(),
				},
			],
		}).compile();

		taskService = module.get(TaskService);
		taskUrlHandler = module.get(TaskUrlHandler);
		await setupEntities([User, Task, Submission, CourseEntity, CourseGroupEntity, LessonEntity, Material]);
	});

	describe('getMetaData', () => {
		describe('when url fits', () => {
			it('should call taskService with the correct id', async () => {
				const id = new ObjectId().toHexString();
				const url = new URL(`https://localhost/homework/${id}`);

				await taskUrlHandler.getMetaData(url);

				expect(taskService.findById).toHaveBeenCalledWith(id);
			});

			it('should take the title from the tasks name', async () => {
				const taskName = 'My Task';
				const task = taskFactory.buildWithId({ name: taskName });
				const url = new URL(`https://localhost/homework/${task.id}`);
				taskService.findById.mockResolvedValue(task);

				const result = await taskUrlHandler.getMetaData(url);

				expect(result).toEqual(expect.objectContaining({ title: taskName, type: MetaDataEntityType.TASK }));
			});
		});

		describe('when url does not fit', () => {
			it('should return undefined', async () => {
				const url = new URL(`https://localhost/invalid/ef2345abe4e3b`);

				const result = await taskUrlHandler.getMetaData(url);

				expect(result).toBeUndefined();
			});
		});
	});
});
