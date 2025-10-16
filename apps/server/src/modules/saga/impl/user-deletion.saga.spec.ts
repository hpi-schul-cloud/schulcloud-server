import { Test, TestingModule } from '@nestjs/testing';
import { SagaRegistryService, SagaStepRegistryService } from '../service';
import { ModuleName, StepOperationType, StepReport } from '../type';
import { UserDeletionSaga } from './user-deletion.saga';
import { UserDeletionSagaExecutionOrder } from './user-deletion.saga';
describe(UserDeletionSaga.name, () => {
	let saga: UserDeletionSaga;
	let stepRegistry: SagaStepRegistryService;
	let sagaRegistry: SagaRegistryService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [UserDeletionSaga, SagaStepRegistryService, SagaRegistryService],
		}).compile();

		saga = module.get(UserDeletionSaga);
		stepRegistry = module.get(SagaStepRegistryService);
		sagaRegistry = module.get(SagaRegistryService);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('constructor', () => {
		it('should register the saga', () => {
			const registerSagaSpy = jest.spyOn(sagaRegistry, 'registerSaga');

			new UserDeletionSaga(stepRegistry, sagaRegistry);

			expect(registerSagaSpy).toHaveBeenCalledWith(saga);
		});
	});

	describe('execute', () => {
		const setup = () => {
			const hasStepSpy = jest.spyOn(stepRegistry, 'hasStep').mockReturnValue(true);
			const stepReport: StepReport = {
				moduleName: ModuleName.ACCOUNT,
				operations: [
					{
						operation: StepOperationType.DELETE,
						count: 1,
						refs: ['67a0784ef358f49ca4faf5c3'],
					},
				],
			};
			const executeStepSpy = jest.spyOn(stepRegistry, 'executeStep').mockResolvedValue(stepReport);
			const numberOfModuleNames = Object.values(UserDeletionSagaExecutionOrder).length;

			return {
				hasStepSpy,
				stepReport,
				executeStepSpy,
				numberOfModuleNames,
			};
		};

		it('should check step registration', async () => {
			const { hasStepSpy, numberOfModuleNames } = setup();

			await saga.execute({ userId: '67a0784ef358f49ca4faf5c4' });

			expect(hasStepSpy).toHaveBeenCalledTimes(numberOfModuleNames + 1);
		});

		it('should execute all steps', async () => {
			const { executeStepSpy, numberOfModuleNames } = setup();

			await saga.execute({ userId: '67a0784ef358f49ca4faf5c4' });

			expect(executeStepSpy).toHaveBeenCalledTimes(numberOfModuleNames + 1);
		});

		it('should execute user deletion step', async () => {
			const { executeStepSpy } = setup();

			await saga.execute({ userId: '67a0784ef358f49ca4faf5c4' });

			expect(executeStepSpy).toHaveBeenCalledWith(ModuleName.USER, 'deleteUserData', {
				userId: '67a0784ef358f49ca4faf5c4',
			});
		});

		it('should throw an error if any step fails', async () => {
			const { executeStepSpy } = setup();
			executeStepSpy.mockRejectedValueOnce(new Error('test step failed'));

			await expect(saga.execute({ userId: '67a0784ef358f49ca4faf5c4' })).rejects.toThrow(
				'Some steps failed: Error: test step failed'
			);
		});

		it('should throw an error if user deletion step fails', async () => {
			setup();
			jest.spyOn(stepRegistry, 'executeStep').mockImplementation((moduleName, saga) => {
				if (moduleName === ModuleName.USER && saga === 'deleteUserData') {
					return Promise.reject(new Error('this is a test error'));
				}
				return Promise.resolve({
					moduleName,
					operations: [],
				});
			});

			await expect(saga.execute({ userId: '67a0784ef358f49ca4faf5c4' })).rejects.toThrow(
				'Step failed: Failed to delete user data in USER module: this is a test error'
			);
		});

		it('should return step reports', async () => {
			const { stepReport } = setup();

			const result = await saga.execute({ userId: '67a0784ef358f49ca4faf5c4' });

			expect(result).toEqual(expect.arrayContaining([stepReport]));
		});
	});
});
