import { type DeletionRequestOutput } from '../interface';

export class DeletionRequestOutputBuilder {
	public static build(requestId: string, deletionPlannedAt: Date): DeletionRequestOutput {
		return {
			requestId,
			deletionPlannedAt,
		};
	}
}
