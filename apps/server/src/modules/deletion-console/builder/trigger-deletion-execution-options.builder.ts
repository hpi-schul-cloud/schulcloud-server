import { type TriggerDeletionExecutionOptions } from '../interface';

export class TriggerDeletionExecutionOptionsBuilder {
	public static build(limit: number, runFailed: boolean): TriggerDeletionExecutionOptions {
		return { limit, runFailed };
	}
}
