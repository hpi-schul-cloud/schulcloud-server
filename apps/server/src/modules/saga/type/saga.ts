import { SagaType } from './saga-type';

export abstract class Saga<T extends keyof SagaType> {
	constructor(public readonly name: T) {}

	public abstract execute(params: SagaType[T]['params']): Promise<SagaType[T]['result']>;
}
