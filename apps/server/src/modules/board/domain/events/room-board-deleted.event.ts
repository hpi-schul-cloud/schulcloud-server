import { EntityId } from '@shared/domain/types';

export class RoomBoardDeletedEvent {
	constructor(public readonly boardId: EntityId, public readonly roomId: EntityId) {}
}
