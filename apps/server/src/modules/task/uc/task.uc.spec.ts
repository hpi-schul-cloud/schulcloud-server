import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Task } from '../entity/task.entity';
import { TaskRepo } from '../repo/task.repo';
import { TaskUC } from './task.uc';

describe.skip('TaskService', () => {
	let service: TaskUC;

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
		}).compile();

		service = module.get<TaskUC>(TaskUC);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
