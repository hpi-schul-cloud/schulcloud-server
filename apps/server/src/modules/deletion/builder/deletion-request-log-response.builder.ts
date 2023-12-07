import { DeletionRequestLogResponse } from '../controller/dto';
import { DeletionLogStatistic, DeletionTargetRef } from '../interface';

export class DeletionRequestLogResponseBuilder {
	static build(
		targetRef: DeletionTargetRef,
		deletionPlannedAt: Date,
		statistics?: DeletionLogStatistic[]
	): DeletionRequestLogResponse {
		const deletionRequestLog = { targetRef, deletionPlannedAt, statistics };

		return deletionRequestLog;
	}
}
