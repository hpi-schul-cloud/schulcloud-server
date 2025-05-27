import { StepType } from './saga-step-type';

export abstract class SagaStep<T extends keyof StepType> {
	constructor(public readonly name: T) {}

	public abstract execute(params: StepType[T]['params']): Promise<StepType[T]['result']>;
	// public abstract compensate(params: StepType[T]['params']): Promise<void>;
}
