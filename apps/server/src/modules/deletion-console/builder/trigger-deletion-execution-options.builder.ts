import { TriggerDeletionExecutionOptions } from '../interface';

export class TriggerDeletionExecutionOptionsBuilder {
	static build(limit: number, runFailed: boolean): TriggerDeletionExecutionOptions {
		return { limit, runFailed };
	}
}
