import { Test, TestingModule } from '@nestjs/testing';
import { TaskRepo } from './task.repo';

describe('TaskService', () => {
	let service: TaskRepo;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [TaskRepo],
		}).compile();

		service = module.get<TaskRepo>(TaskRepo);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
