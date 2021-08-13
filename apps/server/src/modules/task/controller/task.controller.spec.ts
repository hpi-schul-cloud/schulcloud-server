import { Test, TestingModule } from '@nestjs/testing';
import { TaskRepo } from '../repo/task.repo';
import { SubmissionRepo } from '../repo/submission.repo';
import { TaskUC } from '../uc/task.uc';
import { TaskController } from './task.controller';
import { TaskSubmissionMetadataService } from '../domain/task-submission-metadata.service';

describe('TaskController', () => {
	let controller: TaskController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TaskUC,
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
				{
					provide: TaskSubmissionMetadataService,
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
