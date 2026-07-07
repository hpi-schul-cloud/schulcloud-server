import { type DeletionTargetRef, type DomainDeletionReport } from '../../domain/interface';
import { type StatusModel } from '../../domain/types';
import { type DeletionRequestLogResponse } from '../controller/dto';

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
