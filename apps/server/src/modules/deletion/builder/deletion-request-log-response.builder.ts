import { DeletionLogStatistic, DeletionRequestLog, DeletionTargetRef } from '../uc/interface';

export class DeletionRequestLogResponseBuilder {
	static build(
		targetRef: DeletionTargetRef,
		deletionPlannedAt: Date,
		statistics?: DeletionLogStatistic[]
	): DeletionRequestLog {
		const deletionRequestLog = { targetRef, deletionPlannedAt, statistics };

		return deletionRequestLog;
	}
}
