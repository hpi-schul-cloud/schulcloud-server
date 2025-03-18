import { Injectable } from '@nestjs/common';
import { ModuleName, SagaStep, SagaType, StepType } from '../type';
import { SagaRegistryService, SagaStepRegistryService } from '.';
import { UserDeletionSaga } from '../impl';

@Injectable()
export class SagaService {
	constructor(
		private readonly sagaRegistry: SagaRegistryService,
		private readonly sagaStepRegistry: SagaStepRegistryService
	) {
		const userDeletionSaga = new UserDeletionSaga(sagaStepRegistry);
		this.sagaRegistry.registerSaga(userDeletionSaga);
	}

	public registerStep<T extends keyof StepType>(moduleName: ModuleName, step: SagaStep<T>): void {
		this.sagaStepRegistry.registerStep(moduleName, step);
	}

	public async executeSaga<T extends keyof SagaType>(
		name: T,
		params: SagaType[T]['params']
	): Promise<SagaType[T]['result']> {
		const result = await this.sagaRegistry.executeSaga(name, params);

		return result;
	}
}
