import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CopyElementType, CopyStatus, CopyStatusEnum, ICurrentUser } from '@shared/domain';
import { CopyApiResponse } from '@src/modules/learnroom/controller/dto/copy.response';
import { TaskUC } from '../uc';
import { TaskCopyUC } from '../uc/task-copy.uc';
import { TaskController } from './task.controller';

describe('TaskController', () => {
	let controller: TaskController;
	let uc: TaskCopyUC;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				{
					provide: TaskUC,
					useValue: createMock<TaskUC>(),
				},
				{
					provide: TaskCopyUC,
					useValue: createMock<TaskCopyUC>(),
				},
			],
			controllers: [TaskController],
		}).compile();

		controller = module.get(TaskController);
		uc = module.get(TaskCopyUC);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('copyTask', () => {
		describe('when task should be copied via API call', () => {
			const jwt = 'jwt';
			const setup = () => {
				// todo: why not use builder instead of as
				const currentUser = { userId: 'userId' } as ICurrentUser;
				const ucResult = {
					title: 'example title',
					type: 'TASK' as CopyElementType,
					status: 'SUCCESS' as CopyStatusEnum,
					elements: [],
				} as CopyStatus;
				const ucSpy = jest.spyOn(uc, 'copyTask').mockImplementation(() => {
					return Promise.resolve(ucResult);
				});
				return { currentUser, ucSpy };
			};
			it('should call uc with two parentIds', async () => {
				const { currentUser, ucSpy } = setup();
				await controller.copyTask(currentUser, { taskId: 'taskId' }, { courseId: 'id', lessonId: 'anotherId' }, jwt);
				expect(ucSpy).toHaveBeenCalledWith('userId', 'taskId', { courseId: 'id', lessonId: 'anotherId', jwt });
			});

			it('should call uc with one parentId', async () => {
				const { currentUser, ucSpy } = setup();
				await controller.copyTask(currentUser, { taskId: 'taskId' }, { courseId: 'id' }, jwt);
				expect(ucSpy).toHaveBeenCalledWith('userId', 'taskId', { courseId: 'id', jwt });
			});

			it('should return result of correct type', async () => {
				const { currentUser } = setup();
				const result = await controller.copyTask(currentUser, { taskId: 'taskId' }, { courseId: 'id' }, jwt);
				expect(result).toBeInstanceOf(CopyApiResponse);
			});
		});
	});
});
