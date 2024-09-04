import { Room } from '../domain/do/room.do';
import { RoomEntity } from './entity';

export class RoomDomainMapper {
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
