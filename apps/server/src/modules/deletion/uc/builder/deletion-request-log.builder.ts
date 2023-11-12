import { DeletionLogStatistic, DeletionRequestLog, DeletionTargetRef } from '../interface';

export class DeletionRequestLogBuilder {
	static build(
		targetRef: DeletionTargetRef,
		deletionPlannedAt: Date,
		statistics?: DeletionLogStatistic[]
	): DeletionRequestLog {
		const deletionRequestLog = { targetRef, deletionPlannedAt, statistics };

		return deletionRequestLog;
	}
}
