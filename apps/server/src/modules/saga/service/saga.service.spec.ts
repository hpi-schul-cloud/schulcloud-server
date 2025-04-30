import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain/types';
import { SagaRegistryService, SagaService } from '.';
import { UserDeletionSaga } from '../impl';
import { SagaStep } from '../type';
import { SagaStepRegistryService } from './saga-step-registry.service';

// concrete step implementation
// normally implemented in a specific module (e.g. class module)
class DeleteUserReferenceFromClassStep extends SagaStep<'deleteUserReference'> {
	constructor() {
		super('deleteUserReference');
	}

	public execute(params: { userId: EntityId }): Promise<boolean> {
		console.log('Executing deleteUserReferenceFromClass with userId:', params.userId);
		return Promise.resolve(true);
	}

	public compensate(params: { userId: EntityId }): Promise<void> {
		console.log('Compensating deleteUserReferenceFromClass with params:', params);
		return Promise.resolve();
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

		it('should be able to check a step is registered', () => {
			expect(() => {
				stepRegistry.checkStep('news', 'deleteUserReference');
			}).toThrow();
		});
	});
});
