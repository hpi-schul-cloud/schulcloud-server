import { Test, TestingModule } from '@nestjs/testing';
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
					provide: TaskRepo,
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
