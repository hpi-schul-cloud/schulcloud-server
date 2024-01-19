import { TriggerDeletionExecutionOptions } from '../interface';

export class TriggerDeletionExecutionOptionsBuilder {
	static build(limit: number): TriggerDeletionExecutionOptions {
		return { limit };
	}
}
