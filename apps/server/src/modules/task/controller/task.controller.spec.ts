import { Test, TestingModule } from '@nestjs/testing';
import { TaskRepo, SubmissionRepo, LessonRepo } from '../repo';
import { TaskUC } from '../uc/task.uc';
import { TaskController } from './task.controller';
import { UserModule, UserFacade } from '../../user';

describe('TaskController', () => {
	let controller: TaskController;
	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [UserModule],
			providers: [
				TaskUC,
				UserFacade,
				TaskRepo,
				{
					provide: TaskRepo,
					useValue: {},
				},
				SubmissionRepo,
				{
					provide: SubmissionRepo,
					useValue: {},
				},
				LessonRepo,
				{
					provide: LessonRepo,
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

	// TODO: test autentication for each endpoint and method
});
