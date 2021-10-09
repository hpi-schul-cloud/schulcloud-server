import { Test, TestingModule } from '@nestjs/testing';
import { LessonRepo } from '@shared/repo';
import { TaskRepo } from '../repo';
import { TaskUC } from '../uc';
import { TaskAuthorizationService } from '../uc/task.authorization.service';
import { TaskController } from './task.controller';

describe('TaskController', () => {
	let controller: TaskController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TaskUC,
				{
					provide: TaskRepo,
					useValue: {},
				},
				{
					provide: LessonRepo,
					useValue: {},
				},
				{
					provide: TaskAuthorizationService,
					useValue: {
						getPermittedCourses() {
							throw new Error('Please write a mock for TaskAuthorizationService.getPermittedCourses');
						},
					},
				},
			],
			controllers: [TaskController],
		}).compile();

		controller = module.get<TaskController>(TaskController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	it.todo('write unit tests...');
});
