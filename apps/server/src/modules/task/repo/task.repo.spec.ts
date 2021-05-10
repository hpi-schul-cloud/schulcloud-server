import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Task } from '../entity/task.entity';
import { TaskRepo } from './task.repo';

describe('TaskService', () => {
	let service: TaskRepo;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TaskRepo,
				{
					provide: getModelToken(Task.name),
					useValue: {},
				},
			],
		}).compile();

		service = module.get<TaskRepo>(TaskRepo);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
