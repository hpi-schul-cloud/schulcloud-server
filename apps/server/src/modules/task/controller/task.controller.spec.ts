import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@src/modules/copy-helper';
import { CopyApiResponse } from '@src/modules/copy-helper/dto/copy.response';
import { TaskCopyUC, TaskUC } from '../uc';
import { TaskController } from './task.controller';

describe('TaskController', () => {
	let module: TestingModule;
	let controller: TaskController;
	let uc: TaskCopyUC;

	beforeAll(async () => {
		module = await Test.createTestingModule({
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

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('copyTask', () => {
		describe('when task should be copied via API call', () => {
			const setup = () => {
				// todo: why not use builder instead of as
				const currentUser = { userId: 'userId' } as ICurrentUser;
				const ucResult = {
					title: 'example title',
					type: 'TASK' as CopyElementType,
					status: 'SUCCESS' as CopyStatusEnum,
					elements: [],
				} as CopyStatus;
				const ucSpy = jest.spyOn(uc, 'copyTask').mockImplementation(() => Promise.resolve(ucResult));
				return { currentUser, ucSpy };
			};
			it('should call uc with two parentIds', async () => {
				const { currentUser, ucSpy } = setup();
				await controller.copyTask(currentUser, { taskId: 'taskId' }, { courseId: 'id', lessonId: 'anotherId' });
				expect(ucSpy).toHaveBeenCalledWith('userId', 'taskId', {
					courseId: 'id',
					lessonId: 'anotherId',
					userId: currentUser.userId,
				});
			});

			it('should call uc with one parentId', async () => {
				const { currentUser, ucSpy } = setup();
				await controller.copyTask(currentUser, { taskId: 'taskId' }, { courseId: 'id' });
				expect(ucSpy).toHaveBeenCalledWith('userId', 'taskId', { courseId: 'id', userId: 'userId' });
			});

			it('should return result of correct type', async () => {
				const { currentUser } = setup();
				const result = await controller.copyTask(currentUser, { taskId: 'taskId' }, { courseId: 'id' });
				expect(result).toBeInstanceOf(CopyApiResponse);
			});
		});
	});
});
