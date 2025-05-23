import { EntityId } from '@shared/domain/types';

export class RoomDeletedEvent {
	public id: EntityId;

	constructor(id: EntityId) {
		this.id = id;
	}
}
