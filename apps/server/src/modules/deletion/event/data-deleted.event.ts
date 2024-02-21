import { DomainOperation } from '@shared/domain/interface';
import { DeletionRequest } from '../domain';

export class DataDeletedEvent {
	deletionRequest: DeletionRequest;

	domainOperation: DomainOperation;

	constructor(deletionRequest: DeletionRequest, domainOperation: DomainOperation) {
		this.deletionRequest = deletionRequest;
		this.domainOperation = domainOperation;
	}
}
