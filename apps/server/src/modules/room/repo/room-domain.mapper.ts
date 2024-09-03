import { EntityData } from '@mikro-orm/core';
import { RoomEntity } from './entity';
import { Room } from '../domain/do/room.do';

export class RoomDomainMapper {
	static mapDoToEntityData(room: Room): EntityData<RoomEntity> {
		const props = room.getProps();

		const roomEntityData: EntityData<RoomEntity> = {
			id: props.id,
			name: props.name,
			color: props.color,
			startDate: props.startDate,
			untilDate: props.untilDate,
		};

		return roomEntityData;
	}

	static mapEntityToDo(roomEntity: RoomEntity): Room {
		// check identity map reference
		if (roomEntity.domainObject) {
			return roomEntity.domainObject;
		}

		const room: Room = new Room({
			id: roomEntity.id,
			name: roomEntity.name,
			color: roomEntity.color,
			startDate: roomEntity.startDate,
			untilDate: roomEntity.untilDate,
		});

		// attach to identity map
		roomEntity.domainObject = room;

		return room;
	}
}
