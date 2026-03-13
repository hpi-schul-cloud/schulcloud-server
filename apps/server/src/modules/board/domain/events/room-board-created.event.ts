import { EntityId } from '@shared/domain/types';

export class RoomBoardCreatedEvent {
	constructor(public readonly boardId: EntityId, public readonly roomId: EntityId) {}
}
