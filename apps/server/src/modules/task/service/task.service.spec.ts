import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { TaskRepo } from '@shared/repo';
import { TaskService } from './task.service';

describe('TaskService', () => {
	let module: TestingModule;
	let taskRepo: DeepMocked<TaskRepo>;
	let taskService: TaskService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TaskService,
				{
					provide: TaskRepo,
					useValue: createMock<TaskRepo>(),
				},
			],
		}).compile();
		taskRepo = module.get(TaskRepo);
		taskService = module.get(TaskService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findBySingleParent', () => {
		it('should call findBySingleParent from task repo', async () => {
			const courseId = 'courseId';
			const userId = 'user-id';
			taskRepo.findBySingleParent.mockResolvedValueOnce([[], 0]);

			await expect(taskService.findBySingleParent(userId, courseId)).resolves.toEqual([[], 0]);
			expect(taskRepo.findBySingleParent).toBeCalledWith(userId, courseId, undefined, undefined);
		});
	});
});
