import { Test, TestingModule } from '@nestjs/testing';
import { DeleteUserAccountDataStep } from './delete-user-account-data.step';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@core/logger';
import { AccountService } from '..';
import {
	ModuleName,
	SagaService,
	StepOperationType,
	StepReport,
	UserDeletionStepOperationLoggable,
} from '@modules/saga';
import { ObjectId } from '@mikro-orm/mongodb';

describe(DeleteUserAccountDataStep.name, () => {
	let module: TestingModule;
	let step: DeleteUserAccountDataStep;
	let accountService: DeepMocked<AccountService>;
	let logger: DeepMocked<Logger>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				DeleteUserAccountDataStep,
				{
					provide: SagaService,
					useValue: createMock<SagaService>(),
				},
				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		step = module.get(DeleteUserAccountDataStep);
		accountService = module.get(AccountService);
		logger = module.get(Logger);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('step registration', () => {
		it('should register the step with the saga service', () => {
			const sagaService = createMock<SagaService>();
			const step = new DeleteUserAccountDataStep(sagaService, createMock<AccountService>(), createMock<Logger>());

			expect(sagaService.registerStep).toHaveBeenCalledWith(ModuleName.ACCOUNT, step);
		});
	});

	describe('execute', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const accountId = new ObjectId().toHexString();

			return {
				userId,
				accountId,
			};
		};

		it('should call deleteByUserId in accountService', async () => {
			const { accountId, userId } = setup();
			accountService.deleteByUserId.mockResolvedValueOnce([accountId]);

			await step.execute({ userId });

			expect(accountService.deleteByUserId).toHaveBeenCalledWith(userId);
		});

		it('should log the deletion operation', async () => {
			const { accountId, userId } = setup();
			accountService.deleteByUserId.mockResolvedValueOnce([accountId]);

			await step.execute({ userId });

			expect(logger.info).toHaveBeenCalledWith(expect.any(UserDeletionStepOperationLoggable));
		});

		it('should return a StepReport', async () => {
			const { accountId, userId } = setup();
			const expectedResult: StepReport = {
				moduleName: ModuleName.ACCOUNT,
				operations: [
					{
						operation: StepOperationType.DELETE,
						count: 1,
						refs: [accountId],
					},
				],
			};

			accountService.deleteByUserId.mockResolvedValueOnce([accountId]);

			const result = await step.execute({ userId });

			expect(result).toEqual(expectedResult);
		});
	});
});
