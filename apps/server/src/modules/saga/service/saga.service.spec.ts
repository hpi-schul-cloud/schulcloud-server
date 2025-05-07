import { EntityId } from '@shared/domain/types';
import { ModuleName, SagaStep, StepReport } from '../type';
import { Saga } from '../type/saga';
import { SagaRegistryService } from './saga-registry.service';
import { SagaStepRegistryService } from './saga-step-registry.service';
import { SagaService } from './saga.service';

// concrete step implementation
// normally implemented in a specific module (e.g. class module)
class ExampleStep extends SagaStep<'deleteUserData'> {
	constructor() {
		super('deleteUserData');
	}

	public execute(params: { userId: EntityId }): Promise<StepReport> {
		console.log('Executing example step with userId:', params.userId);
		const report: StepReport = {
			moduleName: ModuleName.CLASS,
			operations: [],
		};
		return Promise.resolve(report);
	}
}

export class ExampleSaga extends Saga<'userDeletion'> {
	constructor(
		private readonly sagaRegistry: SagaRegistryService,
		private readonly sagaStepRegistry: SagaStepRegistryService
	) {
		super('userDeletion');

		this.sagaRegistry.registerSaga(this);
	}

	public async execute(params: { userId: EntityId }): Promise<StepReport[]> {
		console.log('Executing example saga with userId:', params.userId);

		const stepReport = await this.sagaStepRegistry.executeStep(ModuleName.CLASS, 'deleteUserData', {
			userId: params.userId,
		});

		return [stepReport];
	}
}

describe(SagaService.name, () => {
	const setup = () => {
		const stepRegistry = new SagaStepRegistryService();
		const sagaRegistry = new SagaRegistryService(stepRegistry);
		const sagaService = new SagaService(sagaRegistry, stepRegistry);

		return {
			sagaService,
			stepRegistry,
			sagaRegistry,
		};
	};

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('registerStep', () => {
		it('should be able to register a step', () => {
			const { sagaService, stepRegistry } = setup();
			// the step should normally be registered from the specific module (e.g. class module)
			const deleteUserDataFromClass = new ExampleStep();
			sagaService.registerStep(ModuleName.CLASS, deleteUserDataFromClass);

			expect(stepRegistry.hasStep(ModuleName.CLASS, 'deleteUserData')).toBe(true);
		});
	});

	describe('with registered step', () => {
		const setupWithStepAndSaga = () => {
			const { sagaService, stepRegistry, sagaRegistry } = setup();
			const deleteUserDataFromClass = new ExampleStep();
			sagaService.registerStep(ModuleName.CLASS, deleteUserDataFromClass);

			new ExampleSaga(sagaRegistry, stepRegistry);

			return { sagaService, stepRegistry };
		};

		describe('executeSaga', () => {
			it('should be able to execute a saga', async () => {
				const { sagaService } = setupWithStepAndSaga();

				const expectedReport: StepReport = {
					moduleName: ModuleName.CLASS,
					operations: [],
				};

				const result = await sagaService.executeSaga('userDeletion', { userId: '67c6c199c9ff0bd1f47b98a2' });
				expect(result).toEqual([expectedReport]);
			});
		});

		describe('step registry', () => {
			it('should be able to detect steps', () => {
				const { stepRegistry } = setupWithStepAndSaga();

				expect(stepRegistry.hasStep(ModuleName.CLASS, 'deleteUserData')).toBe(true);
			});

			it('should be able to check a step is registered', () => {
				expect(() => {
					const { stepRegistry } = setupWithStepAndSaga();

					stepRegistry.checkStep(ModuleName.NEWS, 'deleteUserData');
				}).toThrow();
			});
		});
	});
});
