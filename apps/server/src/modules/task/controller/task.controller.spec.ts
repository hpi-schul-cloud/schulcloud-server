import { Test, TestingModule } from '@nestjs/testing';
import { CourseRepo } from '@src/repositories';
import { TaskRepo, SubmissionRepo } from '../repo';
import { TaskUC } from '../uc';
import { TaskController } from './task.controller';

describe('TaskController', () => {
	let controller: TaskController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TaskUC,
				CourseRepo,
				{
					provide: CourseRepo,
					useValue: {
						findAllByUserId: () => {
							// throw new Error('Please write a mock for CourseRepo.findCoursesWithGroupsByUserId.');
						},
					},
				},
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
