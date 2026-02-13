import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import {
	ModuleName,
	SagaService,
	StepOperationReportBuilder,
	StepOperationType,
	StepReportBuilder,
} from '@modules/saga';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { User, UserMikroOrmRepo } from '../repo';
import { userFactory } from '../testing';
import { DeleteUserStep } from './delete-user.step';

describe(DeleteUserStep.name, () => {
	let module: TestingModule;
	let step: DeleteUserStep;
	let userRepo: DeepMocked<UserMikroOrmRepo>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		await setupEntities([User]);

		module = await Test.createTestingModule({
			providers: [
				DeleteUserStep,
				{
					provide: SagaService,
					useValue: createMock<SagaService>(),
				},
				{
					provide: UserMikroOrmRepo,
					useValue: createMock<UserMikroOrmRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		step = module.get(DeleteUserStep);
		userRepo = module.get(UserMikroOrmRepo);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('step registration', () => {
		it('should register the step with the saga service', () => {
			const sagaService = createMock<SagaService>();
			const step = new DeleteUserStep(sagaService, createMock<UserMikroOrmRepo>(), createMock<Logger>());

			expect(sagaService.registerStep).toHaveBeenCalledWith(ModuleName.USER, step);
		});
	});

	describe('execute', () => {
		describe('when user is missing', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const userId = user.id;

				userRepo.findByIdOrNull.mockResolvedValueOnce(null);
				userRepo.deleteUser.mockResolvedValue(0);

				const expectedResult = StepReportBuilder.build(ModuleName.USER, [
					StepOperationReportBuilder.build(StepOperationType.DELETE, 0, []),
				]);

				return {
					expectedResult,
					userId,
				};
			};

			it('should call userRepo.findByIdOrNull with userId', async () => {
				const { userId } = setup();

				await step.execute({ userId });

				expect(userRepo.findByIdOrNull).toHaveBeenCalledWith(userId, true);
			});

			it('should return domainOperation object with information about deleted user', async () => {
				const { expectedResult, userId } = setup();

				const result = await step.execute({ userId });

				expect(result).toEqual(expectedResult);
			});

			it('should Not call userRepo.deleteUser with userId', async () => {
				const { userId } = setup();

				await step.execute({ userId });

				expect(userRepo.deleteUser).not.toHaveBeenCalled();
			});
		});

		describe('when user exists', () => {
			const setup = () => {
				const user = userFactory.buildWithId();

				const expectedResult = StepReportBuilder.build(ModuleName.USER, [
					StepOperationReportBuilder.build(StepOperationType.DELETE, 1, [user.id]),
				]);

				userRepo.findByIdOrNull.mockResolvedValueOnce(user);
				userRepo.deleteUser.mockResolvedValue(1);

				return {
					expectedResult,
					user,
				};
			};

			it('should call userRepo.findByIdOrNull with userId', async () => {
				const { user } = setup();

				await step.execute({ userId: user.id });

				expect(userRepo.findByIdOrNull).toHaveBeenCalledWith(user.id, true);
			});

			it('should call userRepo.deleteUser with userId', async () => {
				const { user } = setup();

				await step.execute({ userId: user.id });

				expect(userRepo.deleteUser).toHaveBeenCalledWith(user.id);
			});

			it('should return domainOperation object with information about deleted user', async () => {
				const { expectedResult, user } = setup();

				const result = await step.execute({ userId: user.id });

				expect(result).toEqual(expectedResult);
			});
		});

		describe('when user exists but userRepo.deleteUser return 0', () => {
			const setup = () => {
				const user = userFactory.buildWithId();

				userRepo.findByIdOrNull.mockResolvedValueOnce(user);
				userRepo.deleteUser.mockResolvedValue(0);

				const expectedError = new Error(`Failed to delete user '${user.id}' from User collection`);

				return {
					expectedError,
					user,
				};
			};

			it('should throw an error', async () => {
				const { expectedError, user } = setup();

				await expect(step.execute({ userId: user.id })).rejects.toThrow(expectedError);
			});
		});
	});
});
