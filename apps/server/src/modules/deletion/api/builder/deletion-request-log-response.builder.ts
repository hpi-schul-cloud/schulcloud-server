import { DeletionTargetRef, DomainDeletionReport } from '../../domain/interface';
import { StatusModel } from '../../domain/types';
import { DeletionRequestLogResponse } from '../controller/dto';

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
