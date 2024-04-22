// import { EntityId } from '@shared/domain/types';
import { DomainDeletionReport } from '../interface';

export class DataDeletedBatchEvent {
	// deletionRequestId: EntityId;

	domainDeletionReport: DomainDeletionReport[];

	constructor(domainDeletionReport: DomainDeletionReport[]) {
		// this.deletionRequestId = deletionRequestId;
		this.domainDeletionReport = domainDeletionReport;
	}
}
