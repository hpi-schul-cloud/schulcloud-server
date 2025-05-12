import { SagaRegistryService } from './saga-registry.service';
import { SagaStepRegistryService } from './saga-step-registry.service';

describe(SagaRegistryService.name, () => {
	let sagaRegistry: SagaRegistryService;

	beforeEach(() => {
		sagaRegistry = new SagaRegistryService(new SagaStepRegistryService());
	});

	describe('executeSaga', () => {
		describe('when saga is not registered', () => {
			it('should throw an error', async () => {
				const nonExistentSagaName = 'nonExistentSaga';

				const executeFunction = async () => {
					//@ts-expect-error non existent saga name
					await sagaRegistry.executeSaga(nonExistentSagaName, { userId: '67a0784ef358f49ca4faf5c3' });
				};

				await expect(executeFunction()).rejects.toThrowError(`Saga ${nonExistentSagaName} is not registered.`);
			});
		});
	});
});
