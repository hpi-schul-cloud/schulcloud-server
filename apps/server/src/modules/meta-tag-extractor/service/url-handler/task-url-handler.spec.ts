import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { TaskService } from '@modules/task';
import { Test, TestingModule } from '@nestjs/testing';
import { Task } from '@shared/domain/entity';
import { setupEntities } from '@testing/setup-entities';
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
		await setupEntities();
	});

	describe('getMetaData', () => {
		describe('when url fits', () => {
			it('should call taskService with the correct id', async () => {
				const id = '671a5bdf0995ace8cbc6f899';
				const url = new URL(`https://localhost/homework/${id}`);

				await taskUrlHandler.getMetaData(url);

				expect(taskService.findById).toHaveBeenCalledWith(id);
			});

			it('should take the title from the tasks name', async () => {
				const id = '671a5bdf0995ace8cbc6f899';
				const url = new URL(`https://localhost/homework/${id}`);
				const taskName = 'My Task';
				taskService.findById.mockResolvedValue({ name: taskName } as Task);

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
