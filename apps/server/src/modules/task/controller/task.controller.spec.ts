import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { TaskUC } from '../uc';
import { TaskCopyUC } from '../uc/task-copy.uc';
import { TaskController } from './task.controller';

describe('TaskController', () => {
	let controller: TaskController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				{
					provide: TaskUC,
					useValue: createMock<TaskUC>(),
				},
				{
					provide: TaskCopyUC,
					useValue: createMock<TaskCopyUC>(),
				},
			],
			controllers: [TaskController],
		}).compile();

		controller = module.get(TaskController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
