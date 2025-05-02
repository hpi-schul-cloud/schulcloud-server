import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain/types';
import { SagaRegistryService, SagaService } from '.';
import { UserDeletionSaga } from '../impl';
import { ModuleName, SagaStep, StepReport } from '../type';
import { SagaStepRegistryService } from './saga-step-registry.service';

// concrete step implementation
// normally implemented in a specific module (e.g. class module)
class DeleteUserDataFromClassStep extends SagaStep<'deleteUserData'> {
	constructor() {
		super('deleteUserData');
	}

	public execute(params: { userId: EntityId }): Promise<StepReport> {
		console.log('Executing deleteUserDataFromClass with userId:', params.userId);
		const report: StepReport = {
			moduleName: ModuleName.CLASS,
			operations: [],
		};
		return Promise.resolve(report);
	}
}

describe(SagaService.name, () => {
	let module: TestingModule;
	let sagaService: SagaService;
	let stepRegistry: SagaStepRegistryService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [SagaService, SagaStepRegistryService, SagaRegistryService, UserDeletionSaga],
		}).compile();

		sagaService = module.get(SagaService);
		stepRegistry = module.get(SagaStepRegistryService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('registerStep', () => {
		it('should be able to register a step', () => {
			// the step should normally be registered from the specific module (e.g. class module)
			const deleteUserDataFromClass = new DeleteUserDataFromClassStep();
			sagaService.registerStep(ModuleName.CLASS, deleteUserDataFromClass);

			expect(stepRegistry.hasStep(ModuleName.CLASS, 'deleteUserData')).toBe(true);
		});
	});

	describe('executeSaga', () => {
		it('should be able to execute a saga', async () => {
			jest.spyOn(stepRegistry, 'executeStep').mockResolvedValue({ moduleName: ModuleName.CLASS, operations: [] });
			const result = await sagaService.executeSaga('userDeletion', { userId: '67c6c199c9ff0bd1f47b98a2' });
			expect(result).toBe(true);
		});
	});

	describe('step registry', () => {
		it('should be able to detect steps', () => {
			expect(stepRegistry.hasStep(ModuleName.CLASS, 'deleteUserData')).toBe(true);
		});

		it('should be able to check a step is registered', () => {
			expect(() => {
				stepRegistry.checkStep(ModuleName.NEWS, 'deleteUserData');
			}).toThrow();
		});
	});
});
