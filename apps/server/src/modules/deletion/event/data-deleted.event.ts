import { DomainDeletionReport } from '@shared/domain/interface';
import { DeletionRequest } from '../domain';

export class DataDeletedEvent {
	deletionRequest: DeletionRequest;

	domainOperation: DomainDeletionReport;

	constructor(deletionRequest: DeletionRequest, domainOperation: DomainDeletionReport) {
		this.deletionRequest = deletionRequest;
		this.domainOperation = domainOperation;
	}
}
