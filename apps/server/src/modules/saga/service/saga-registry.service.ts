import { Injectable } from '@nestjs/common';
import type { Saga, SagaType } from '../type';
import { SagaStepRegistryService } from './saga-step-registry.service';

@Injectable()
export class SagaRegistryService {
	private sagas: Map<keyof SagaType, Saga<keyof SagaType>> = new Map();

	constructor(private stepRegistry: SagaStepRegistryService) {}

	public registerSaga<T extends keyof SagaType>(saga: Saga<T>): void {
		this.sagas.set(saga.name, saga);
	}

	public executeSaga<T extends keyof SagaType>(name: T, params: SagaType[T]['params']): Promise<SagaType[T]['result']> {
		const saga = this.sagas.get(name);
		if (!saga) {
			throw new Error(`Saga ${name} is not registered.`);
		}
		return saga.execute(params);
	}
}
