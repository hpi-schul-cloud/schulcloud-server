import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { RocketChatError, RocketChatService } from '@modules/rocketchat/rocket-chat.service';
import {
	ModuleName,
	SagaService,
	StepOperationReportBuilder,
	StepOperationType,
	StepReportBuilder,
} from '@modules/saga';
import { Test, TestingModule } from '@nestjs/testing';
import { rocketChatUserFactory } from '../domain/testing';
import { RocketChatUserRepo } from '../repo';
import { DeleteUserRocketChatDataStep } from './delete-user-rocketchat-data.step';

describe(DeleteUserRocketChatDataStep.name, () => {
	let module: TestingModule;
	let step: DeleteUserRocketChatDataStep;
	let rocketChatUserRepo: DeepMocked<RocketChatUserRepo>;
	let rocketChatService: DeepMocked<RocketChatService>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				DeleteUserRocketChatDataStep,
				{
					provide: SagaService,
					useValue: createMock<SagaService>(),
				},
				{
					provide: RocketChatUserRepo,
					useValue: createMock<RocketChatUserRepo>(),
				},
				{
					provide: RocketChatService,
					useValue: createMock<RocketChatService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		step = module.get(DeleteUserRocketChatDataStep);
		rocketChatUserRepo = module.get(RocketChatUserRepo);
		rocketChatService = module.get(RocketChatService);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('step registration', () => {
		it('should register the step with the saga service', () => {
			const sagaService = createMock<SagaService>();
			const step = new DeleteUserRocketChatDataStep(
				sagaService,
				createMock<RocketChatUserRepo>(),
				createMock<RocketChatService>(),
				createMock<Logger>()
			);

			expect(sagaService.registerStep).toHaveBeenCalledWith(ModuleName.ROCKETCHATUSER, step);
		});
	});

	describe('execute', () => {
		describe('when rocketChatUser does not exist', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();

				rocketChatUserRepo.findByUserId.mockResolvedValueOnce(null);

				const expectedResult = StepReportBuilder.build(ModuleName.ROCKETCHATUSER, [
					StepOperationReportBuilder.build(StepOperationType.DELETE, 0, []),
					StepOperationReportBuilder.build(StepOperationType.DELETE, 0, []),
				]);

				return {
					userId,
					expectedResult,
				};
			};

			it('should call rocketChatUserRepo', async () => {
				const { userId } = setup();

				await step.execute({ userId });

				expect(rocketChatUserRepo.findByUserId).toBeCalledWith(userId);
			});

			it('should return domainOperation object with information about deleted user', async () => {
				const { userId, expectedResult } = setup();

				const result = await step.execute({ userId });

				expect(result).toEqual(expectedResult);
			});

			it('should Not call rocketChatUserRepo.deleteByUserId with userId', async () => {
				const { userId } = setup();

				await step.execute({ userId });

				expect(rocketChatUserRepo.deleteByUserId).not.toHaveBeenCalled();
			});
		});

		describe('when rocketChatUser exists and succesfull deleted', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const rocketChatUser = rocketChatUserFactory.build();

				rocketChatUserRepo.findByUserId.mockResolvedValueOnce(rocketChatUser);
				rocketChatUserRepo.deleteByUserId.mockResolvedValueOnce(1);
				rocketChatService.deleteUser.mockResolvedValueOnce({ success: true });

				const expectedResult = StepReportBuilder.build(ModuleName.ROCKETCHATUSER, [
					StepOperationReportBuilder.build(StepOperationType.DELETE, 1, [rocketChatUser.id]),
					StepOperationReportBuilder.build(StepOperationType.DELETE, 1, [rocketChatUser.username]),
				]);

				return {
					userId,
					expectedResult,
					rocketChatUser,
				};
			};

			it('should call rocketChatUserRepo', async () => {
				const { userId } = setup();

				await step.execute({ userId });

				expect(rocketChatUserRepo.findByUserId).toBeCalledWith(userId);
			});

			it('should call rocketChatService.deleteUser with username', async () => {
				const { rocketChatUser, userId } = setup();

				await step.execute({ userId });

				expect(rocketChatService.deleteUser).toBeCalledWith(rocketChatUser.username);
			});

			it('should call rocketChatUserRepo.deleteByUserId with userId', async () => {
				const { rocketChatUser, userId } = setup();

				await step.execute({ userId });

				expect(rocketChatUserRepo.deleteByUserId).toBeCalledWith(rocketChatUser.userId);
			});

			it('should return domainOperation object with information about deleted user', async () => {
				const { userId, expectedResult } = setup();

				const result = await step.execute({ userId });

				expect(result).toEqual(expectedResult);
			});
		});

		describe('when rocketChatUser exists and there is no user in rocketChatService', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const rocketChatUser = rocketChatUserFactory.build();

				rocketChatUserRepo.findByUserId.mockResolvedValueOnce(rocketChatUser);
				rocketChatUserRepo.deleteByUserId.mockResolvedValueOnce(1);
				rocketChatService.deleteUser.mockRejectedValueOnce(
					new RocketChatError({
						response: {
							statusText: '',
							statusCode: 400,
							data: {
								errorType: 'error-invalid-user',
								error: 'error-invalid-user',
								success: false,
							},
						},
					})
				);

				const expectedResult = StepReportBuilder.build(ModuleName.ROCKETCHATUSER, [
					StepOperationReportBuilder.build(StepOperationType.DELETE, 1, [rocketChatUser.id]),
					StepOperationReportBuilder.build(StepOperationType.DELETE, 0, []),
				]);

				return {
					expectedResult,
					rocketChatUser,
					userId,
				};
			};

			it('should call rocketChatUserRepo.deleteByUserId with userId', async () => {
				const { rocketChatUser, userId } = setup();

				await step.execute({ userId });

				expect(rocketChatUserRepo.deleteByUserId).toBeCalledWith(rocketChatUser.userId);
			});

			it('should return domainOperation object with information about deleted user', async () => {
				const { userId, expectedResult } = setup();

				const result = await step.execute({ userId });

				expect(result).toEqual(expectedResult);
			});
		});

		describe('when rocketChatUser exists and got error during deletion rocketChat user', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const rocketChatUser = rocketChatUserFactory.build();

				rocketChatUserRepo.findByUserId.mockResolvedValueOnce(rocketChatUser);
				rocketChatUserRepo.deleteByUserId.mockResolvedValueOnce(1);
				rocketChatService.deleteUser.mockRejectedValueOnce(new Error());

				const expectedError = `Failed to delete user data for userId '${userId}' from RocketChatUser collection / RocketChat service`;

				return {
					expectedError,
					userId,
				};
			};

			it('should throw an error', async () => {
				const { expectedError, userId } = setup();

				await expect(step.execute({ userId })).rejects.toThrowError(new Error(expectedError));
			});
		});
	});
});
