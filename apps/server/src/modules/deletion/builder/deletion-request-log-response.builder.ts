import { DomainOperation } from '@shared/domain/interface';
import { DeletionRequestLogResponse } from '../controller/dto';
import { DeletionTargetRef } from '../interface';

export class DeletionRequestLogResponseBuilder {
	static build(
		targetRef: DeletionTargetRef,
		deletionPlannedAt: Date,
		statistics?: DomainOperation[]
	): DeletionRequestLogResponse {
		const deletionRequestLog = { targetRef, deletionPlannedAt, statistics };

		return deletionRequestLog;
	}
}
