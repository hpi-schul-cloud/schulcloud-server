import { EntityId } from '@shared/domain/types';

export class RoomCreatedEvent {
	constructor(public readonly roomId: EntityId) {}
}
