import { DeletionRequestOutput } from '../interface';

export class DeletionRequestOutputBuilder {
	static build(requestId: string, deletionPlannedAt: Date): DeletionRequestOutput {
		return {
			requestId,
			deletionPlannedAt,
		};
	}
}
