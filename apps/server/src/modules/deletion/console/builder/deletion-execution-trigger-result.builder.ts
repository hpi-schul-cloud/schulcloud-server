import { DeletionExecutionTriggerResult, DeletionExecutionTriggerStatus } from '../interface';

export class DeletionExecutionTriggerResultBuilder {
	private static build(status: DeletionExecutionTriggerStatus, error?: string): DeletionExecutionTriggerResult {
		const output: DeletionExecutionTriggerResult = { status };

		if (error) {
			output.error = error;
		}

		return output;
	}

	static buildSuccess(): DeletionExecutionTriggerResult {
		return this.build(DeletionExecutionTriggerStatus.SUCCESS);
	}

	static buildFailure(err: Error): DeletionExecutionTriggerResult {
		return this.build(DeletionExecutionTriggerStatus.FAILURE, err.toString());
	}
}
