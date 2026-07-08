import { type EntityId } from '@shared/domain/types';

export interface SchulconnexGroupRemovalMessage {
	userId: EntityId;
	groupId: EntityId;
}
