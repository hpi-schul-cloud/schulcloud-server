import { DomainDeletionReport } from '@shared/domain/interface';
import { DeletionRequest } from '../domain';

export class DataDeletedEvent {
	deletionRequest: DeletionRequest;

	domainDeletionReport: DomainDeletionReport;

	constructor(deletionRequest: DeletionRequest, domainDeletionReport: DomainDeletionReport) {
		this.deletionRequest = deletionRequest;
		this.domainDeletionReport = domainDeletionReport;
	}
}
