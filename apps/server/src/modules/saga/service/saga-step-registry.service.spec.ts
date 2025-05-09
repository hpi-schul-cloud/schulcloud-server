import { ModuleName, SagaStep, StepOperationType, StepReport } from '../type';
import { SagaStepRegistryService } from './saga-step-registry.service';

class ExampleStep extends SagaStep<'deleteUserData'> {
	constructor() {
		super('deleteUserData');
	}

	async execute(params: { userId: string }): Promise<StepReport> {
		const stepReport: StepReport = {
			moduleName: ModuleName.ACCOUNT,
			operations: [
				{
					operation: StepOperationType.DELETE,
					count: 1,
					refs: [params.userId],
				},
			],
		};

		const result = await Promise.resolve(stepReport);

		return result;
	}
}

describe(SagaStepRegistryService.name, () => {
	let stepRegistry: SagaStepRegistryService;

	beforeEach(() => {
		stepRegistry = new SagaStepRegistryService();
	});

	describe('executeStep', () => {
		describe('when module is not registered', () => {
			it('should throw an error', async () => {
				const moduleName = ModuleName.BOARD;

				const executeFunction = async () => {
					await stepRegistry.executeStep(moduleName, 'deleteUserData', { userId: '67a0784ef358f49ca4faf5c3' });
				};

				await expect(executeFunction()).rejects.toThrowError(`Module ${moduleName} is not registered.`);
			});
		});

		describe('when step is not registered', () => {
			it('should throw an error', async () => {
				const moduleName = ModuleName.ACCOUNT;
				const exampleStep = new ExampleStep();
				stepRegistry.registerStep(ModuleName.ACCOUNT, exampleStep);

				const nonExistentStepName = 'nonExistentStep';

				const executeFunction = async () => {
					//@ts-expect-error non existent step name
					await stepRegistry.executeStep(moduleName, nonExistentStepName, { userId: '67a0784ef358f49ca4faf5c3' });
				};

				await expect(executeFunction()).rejects.toThrowError(
					`Step ${nonExistentStepName} in module ${moduleName} is not registered.`
				);
			});
		});
	});
});
