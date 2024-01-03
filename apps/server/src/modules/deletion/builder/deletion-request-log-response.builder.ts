import { DeletionRequestLogResponse } from '../controller/dto';
import { DeletionStatusModel } from '../domain/types';
import { DeletionLogStatistic, DeletionTargetRef } from '../interface';

export class DeletionRequestLogResponseBuilder {
	static build(
		targetRef: DeletionTargetRef,
		deletionPlannedAt: Date,
		status: DeletionStatusModel,
		statistics?: DeletionLogStatistic[]
	): DeletionRequestLogResponse {
		const deletionRequestLog = { targetRef, deletionPlannedAt, status, statistics };

		return deletionRequestLog;
	}
}
