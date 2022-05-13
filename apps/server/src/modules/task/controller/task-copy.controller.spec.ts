import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { TaskCopyUC } from '../uc/task-copy.uc';
import { TaskCopyController } from './task-copy.controller';

describe('TaskCopyController', () => {
	let controller: TaskCopyController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				{
					provide: TaskCopyUC,
					useValue: createMock<TaskCopyUC>(),
				},
			],
			controllers: [TaskCopyController],
		}).compile();

		controller = module.get(TaskCopyController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
