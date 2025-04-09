import { Injectable } from '@nestjs/common';
import type { ModuleName, SagaStep, SagaType, StepType } from '../type';
import { SagaRegistryService } from './saga-registry.service';
import { SagaStepRegistryService } from './saga-step-registry.service';

@Injectable()
export class SagaService {
	constructor(
		private readonly sagaRegistry: SagaRegistryService,
		private readonly sagaStepRegistry: SagaStepRegistryService
	) {}

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
