import { DeletionRequest } from '../domain';

export class UserDeletedEvent {
	deletionRequest: DeletionRequest;

	constructor(deletionRequest: DeletionRequest) {
		this.deletionRequest = deletionRequest;
	}
}
