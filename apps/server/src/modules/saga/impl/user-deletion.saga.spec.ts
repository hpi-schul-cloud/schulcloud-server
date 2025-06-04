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

			return {
				hasStepSpy,
				stepReport,
				executeStepSpy,
			};
		};

		it('should check step registration', async () => {
			const { hasStepSpy } = setup();

			await saga.execute({ userId: '67a0784ef358f49ca4faf5c4' });

			const numberOfModuleNames = Object.values(UserDeletionSagaExecutionOrder).length;
			expect(hasStepSpy).toHaveBeenCalledTimes(numberOfModuleNames);
		});

		it('should execute step', async () => {
			const { executeStepSpy } = setup();

			await saga.execute({ userId: '67a0784ef358f49ca4faf5c4' });

			expect(executeStepSpy).toHaveBeenCalledWith(ModuleName.ACCOUNT, 'deleteUserData', {
				userId: '67a0784ef358f49ca4faf5c4',
			});
		});

		it('should return step reports', async () => {
			const { stepReport } = setup();

			const result = await saga.execute({ userId: '67a0784ef358f49ca4faf5c4' });

			expect(result).toEqual(expect.arrayContaining([stepReport]));
		});
	});
});
