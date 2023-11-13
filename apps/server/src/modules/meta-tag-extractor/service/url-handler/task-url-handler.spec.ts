import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Task } from '@shared/domain';
import { setupEntities } from '@shared/testing';
import { TaskService } from '@src/modules/task/service';
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
		it('should call taskService with the correct id', async () => {
			const id = 'af322312feae';
			const url = `https://localhost/homework/${id}`;

			await taskUrlHandler.getMetaData(url);

			expect(taskService.findById).toHaveBeenCalledWith(id);
		});

		it('should take the title from the tasks name', async () => {
			const id = 'af322312feae';
			const url = `https://localhost/homework/${id}`;
			const taskName = 'My Task';
			taskService.findById.mockResolvedValue({ name: taskName } as Task);

			const result = await taskUrlHandler.getMetaData(url);

			expect(result).toEqual(expect.objectContaining({ title: taskName, type: 'task' }));
		});
	});
});
