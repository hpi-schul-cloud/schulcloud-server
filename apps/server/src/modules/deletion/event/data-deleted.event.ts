import { DomainDeletionReport } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';

export class DataDeletedEvent {
	deletionRequestId: EntityId;

	domainDeletionReport: DomainDeletionReport;

	constructor(deletionRequestId: EntityId, domainDeletionReport: DomainDeletionReport) {
		this.deletionRequestId = deletionRequestId;
		this.domainDeletionReport = domainDeletionReport;
	}
}
