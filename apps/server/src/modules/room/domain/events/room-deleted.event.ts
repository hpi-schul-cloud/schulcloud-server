import { type EntityId } from '@shared/domain/types';

export class RoomDeletedEvent {
	constructor(public readonly id: EntityId) {}
}
