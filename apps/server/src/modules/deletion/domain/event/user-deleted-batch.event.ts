import { DeletionRequest } from '../do';

export class UserDeletedBatchEvent {
	deletionRequests: DeletionRequest[];

	constructor(deletionRequests: DeletionRequest[]) {
		this.deletionRequests = deletionRequests;
	}
}
