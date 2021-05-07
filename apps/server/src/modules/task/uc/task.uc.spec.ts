import { Test, TestingModule } from '@nestjs/testing';
import { TaskUC } from './task.uc';

describe('TaskService', () => {
	let service: TaskUC;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [TaskUC],
		}).compile();

		service = module.get<TaskUC>(TaskUC);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
