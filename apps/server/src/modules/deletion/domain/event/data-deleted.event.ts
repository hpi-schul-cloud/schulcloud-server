import { EntityId } from '@shared/domain/types';
import { DomainDeletionReport } from '../interface';

export class DataDeletedEvent {
	deletionRequestId: EntityId;

	domainDeletionReport: DomainDeletionReport;

	constructor(deletionRequestId: EntityId, domainDeletionReport: DomainDeletionReport) {
		this.deletionRequestId = deletionRequestId;
		this.domainDeletionReport = domainDeletionReport;
	}
}
