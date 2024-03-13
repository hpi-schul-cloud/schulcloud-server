import { EntityId } from '@shared/domain/types';

export class UserDeletedEvent {
	deletionRequestId: EntityId;

	targetRefId: EntityId;

	constructor(deletionRequestId: EntityId, targetRefId: EntityId) {
		this.deletionRequestId = deletionRequestId;
		this.targetRefId = targetRefId;
	}
}
