import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';

describe('TaskController', () => {
	let controller: TaskController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [TaskController],
		}).compile();

		controller = module.get<TaskController>(TaskController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	it('should return unauthorized when user is not authorized');
	it('should return open homeworks');
	it('should not return homeworks of other users');
});
