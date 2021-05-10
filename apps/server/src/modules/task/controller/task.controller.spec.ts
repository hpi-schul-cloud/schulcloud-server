import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { TaskRepo } from '../repo/task.repo';
import { TaskUC } from '../uc/task.uc';
import { Task } from '../entity/task.entity';
import { TaskController } from './task.controller';

describe('TaskController', () => {
	let controller: TaskController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TaskUC,
				TaskRepo,
				{
					provide: getModelToken(Task.name),
					useValue: {},
				},
			],
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
