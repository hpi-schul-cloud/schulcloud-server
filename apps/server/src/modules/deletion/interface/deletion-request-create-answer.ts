import { EntityId } from '@shared/domain/types';

export interface DeletionRequestCreateAnswer {
	requestId: EntityId;
	deletionPlannedAt: Date;
}
