import { QueueDeletionRequestOutput } from '../interface';

export class QueueDeletionRequestOutputBuilder {
	private static build(requestId?: string, deletionPlannedAt?: Date, error?: string): QueueDeletionRequestOutput {
		const output: QueueDeletionRequestOutput = {};

		if (requestId) {
			output.requestId = requestId;
		}

		if (deletionPlannedAt) {
			output.deletionPlannedAt = deletionPlannedAt;
		}

		if (error) {
			output.error = error.toString();
		}

		return output;
	}

	static buildSuccess(requestId: string, deletionPlannedAt: Date): QueueDeletionRequestOutput {
		return this.build(requestId, deletionPlannedAt);
	}

	static buildError(err: Error): QueueDeletionRequestOutput {
		return this.build(undefined, undefined, err.toString());
	}
}
