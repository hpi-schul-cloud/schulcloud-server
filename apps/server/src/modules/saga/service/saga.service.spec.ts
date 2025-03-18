import { EntityId } from '@shared/domain/types';
import { SagaRegistryService, SagaService } from '.';
import { SagaStep } from '../type';
import { SagaStepRegistryService } from './saga-step-registry.service';
import { Test, TestingModule } from '@nestjs/testing';

// concrete step implementation
// normally implemented in a specific module (e.g. class module)
class DeleteUserReferenceFromClassStep extends SagaStep<'deleteUserReference'> {
	constructor() {
		super('deleteUserReference');
	}

	public execute(params: { userId: EntityId }): Promise<boolean> {
		return Promise.resolve(true);
	}

	public compensate(params: { userId: EntityId }): Promise<void> {
		throw new Error('Method not implemented.');
	}
}

describe(SagaService.name, () => {
	let module: TestingModule;
	let sagaService: SagaService;
	let stepRegistry: SagaStepRegistryService;
	let sagaRegistry: SagaRegistryService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [SagaService, SagaStepRegistryService, SagaRegistryService],
		}).compile();

		sagaService = module.get(SagaService);
		stepRegistry = module.get(SagaStepRegistryService);
		sagaRegistry = module.get(SagaRegistryService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('registerStep', () => {
		it('should be able to register a step', async () => {
			// the step should normally be registered from the specific module (e.g. class module)
			const deleteUserReferenceFromClass = new DeleteUserReferenceFromClassStep();
			sagaService.registerStep('class', deleteUserReferenceFromClass);

			expect(stepRegistry.hasStep('class', 'deleteUserReference')).toBe(true);
		});
	});

	describe('executeSaga', () => {
		it('should be able to execute a saga', async () => {
			const result = await sagaService.executeSaga('userDeletion', { userId: '67c6c199c9ff0bd1f47b98a2' });
			expect(result).toBe(true);
		});
	});

	describe('step registry', () => {
		it('should be able to detect steps', () => {
			expect(stepRegistry.hasStep('class', 'deleteUserReference')).toBe(true);
		});

		it('should be able to check a step is registered', async () => {
			expect(() => {
				stepRegistry.checkStep('news', 'deleteUserReference');
			}).toThrow();
		});
	});
});
