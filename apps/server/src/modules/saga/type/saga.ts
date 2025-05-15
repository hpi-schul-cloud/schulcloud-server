import { EntityId } from '@shared/domain/types';
import { StepReport } from './report';

export interface SagaType {
	userDeletion: { params: { userId: EntityId }; result: StepReport[] };
	// add more, e.g:
	// saga1: { params: { id: number }; result: string };
	// saga2: { params: { name: string }; result: boolean };
}

export abstract class Saga<T extends keyof SagaType> {
	constructor(public readonly name: T) {}

	public abstract execute(params: SagaType[T]['params']): Promise<SagaType[T]['result']>;
}
