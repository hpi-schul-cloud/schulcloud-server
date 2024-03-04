import { DomainDeletionReport } from '@shared/domain/interface';
import { DeletionRequestLogResponse } from '../controller/dto';
import { DeletionStatusModel } from '../domain/types';
import { DeletionTargetRef } from '../interface';

export class DeletionRequestLogResponseBuilder {
	static build(
		targetRef: DeletionTargetRef,
		deletionPlannedAt: Date,
		status: DeletionStatusModel,
		statistics?: DomainDeletionReport[]
	): DeletionRequestLogResponse {
		const deletionRequestLog = { targetRef, deletionPlannedAt, status, statistics };

		return deletionRequestLog;
	}
}
