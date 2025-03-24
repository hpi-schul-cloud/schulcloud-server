import { EntityId } from '@shared/domain/types';

export interface StepType {
	deleteUserReference: { params: { userId: EntityId }; result: boolean };
	// add more, e.g.:
	// step1: { params: { value: number }; result: string };
	// step2: { params: { message: string }; result: boolean };
}

export type ModuleName = 'class' | 'news';

export abstract class SagaStep<T extends keyof StepType> {
	constructor(public readonly name: T) {}

	public abstract execute(params: StepType[T]['params']): Promise<StepType[T]['result']>;
	public abstract compensate(params: StepType[T]['params']): Promise<void>;
}
