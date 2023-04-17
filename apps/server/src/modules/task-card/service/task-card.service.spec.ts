import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Actions, Permission, User } from '@shared/domain';
import { TaskCardRepo, UserRepo } from '@shared/repo';
import { setupEntities, taskCardFactory, userFactory } from '@shared/testing';
import { AuthorizationService } from '@src/modules';
import { TaskCardService } from './task-card.service';

let user!: User;
let userRepo: DeepMocked<UserRepo>;
let authorizationService: DeepMocked<AuthorizationService>;

describe('TaskService', () => {
	let module: TestingModule;
	let taskCardRepo: DeepMocked<TaskCardRepo>;
	let taskCardService: TaskCardService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TaskCardService,
				{
					provide: TaskCardRepo,
					useValue: createMock<TaskCardRepo>(),
				},
				{ provide: AuthorizationService, useValue: createMock<AuthorizationService>() },
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
			],
		}).compile();

		taskCardRepo = module.get(TaskCardRepo);
		taskCardService = module.get(TaskCardService);
		userRepo = module.get(UserRepo);
		authorizationService = module.get(AuthorizationService);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('getCompletedForUsers', () => {
		beforeEach(() => {
			user = userFactory.buildWithId();
			userRepo.findById.mockResolvedValue(user);
		});

		it('should check for beta task permission', async () => {
			const taskCard = taskCardFactory.buildWithId();
			await taskCardService.getCompletedForUsers(user.id, taskCard.id);
			expect(authorizationService.checkPermission).toBeCalledWith(user, taskCard, {
				action: Actions.write,
				requiredPermissions: [Permission.TASK_CARD_EDIT],
			});
		});

		it('should return list of completed userIds', async () => {
			const completedUser = userFactory.buildWithId();
			const taskCard = taskCardFactory.buildWithId({ completedUsers: [completedUser] });
			taskCardRepo.findById.mockResolvedValueOnce(taskCard);
			authorizationService.hasPermission.mockReturnValue(true);
			const result = await taskCardService.getCompletedForUsers(user.id, taskCard.id);
			const expectedResult = [completedUser.id];
			expect(result).toStrictEqual(expectedResult);
		});
	});

	describe('isCompletedForUser', () => {
		beforeEach(() => {
			user = userFactory.buildWithId();
			userRepo.findById.mockResolvedValue(user);
		});

		it('should check for beta task permission', async () => {
			const taskCard = taskCardFactory.buildWithId();
			await taskCardService.isCompletedForUser(user.id, taskCard.id);
			expect(authorizationService.checkPermission).toBeCalledWith(user, taskCard, {
				action: Actions.read,
				requiredPermissions: [Permission.TASK_CARD_VIEW],
			});
		});

		it('should return true if user completed beta task', async () => {
			const taskCard = taskCardFactory.buildWithId({ completedUsers: [user] });
			taskCardRepo.findById.mockResolvedValueOnce(taskCard);
			authorizationService.hasPermission.mockReturnValue(true);
			const result = await taskCardService.isCompletedForUser(user.id, taskCard.id);
			expect(result).toStrictEqual(true);
		});

		it('should return false if user did not complete beta task', async () => {
			const taskCard = taskCardFactory.buildWithId({ completedUsers: [] });
			taskCardRepo.findById.mockResolvedValueOnce(taskCard);
			authorizationService.hasPermission.mockReturnValue(true);
			const result = await taskCardService.isCompletedForUser(user.id, taskCard.id);
			expect(result).toStrictEqual(false);
		});
	});
});
