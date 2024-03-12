import { DeletionRequestLogResponse } from '../controller/dto';
import { DeletionTargetRef, DomainDeletionReport } from '../interface';
import { StatusModel } from '../types';

export class DeletionRequestLogResponseBuilder {
	static build(
		targetRef: DeletionTargetRef,
		deletionPlannedAt: Date,
		status: StatusModel,
		statistics?: DomainDeletionReport[]
	): DeletionRequestLogResponse {
		const deletionRequestLog = { targetRef, deletionPlannedAt, status, statistics };

		return deletionRequestLog;
	}
}
