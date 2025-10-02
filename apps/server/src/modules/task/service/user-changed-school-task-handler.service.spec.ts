import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { UserChangedSchoolEvent } from '../../user/domain/events/user-changed-school.event';
import { TaskRepo } from '../repo/task.repo';
import { UserChangedSchoolTaskHandlerService } from './user-changed-school-task-handler.service';
import { MikroORM } from '@mikro-orm/core';

describe(UserChangedSchoolTaskHandlerService.name, () => {
	let module: TestingModule;
	let service: UserChangedSchoolTaskHandlerService;
	let taskRepo: DeepMocked<TaskRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserChangedSchoolTaskHandlerService,
				{
					provide: TaskRepo,
					useValue: createMock<TaskRepo>(),
				},
				{
					provide: MikroORM,
					useValue: createMock<MikroORM>(),
				},
			],
		}).compile();

		service = module.get(UserChangedSchoolTaskHandlerService);
		taskRepo = module.get(TaskRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should delete all private tasks for the user by teacherId', async () => {
		const userId = 'user-123';
		const event = new UserChangedSchoolEvent(userId, 'school-456');
		await service.handle(event);
		expect(taskRepo.deleteAllPrivateTasksByTeacherId).toHaveBeenCalledWith(userId);
	});
});
