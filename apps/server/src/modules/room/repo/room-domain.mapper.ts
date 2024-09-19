import { Room } from '../domain/do/room.do';
import { RoomEntity } from './entity';

export class RoomDomainMapper {
	static mapEntityToDo(roomEntity: RoomEntity): Room {
		// check identity map reference
		if (roomEntity.domainObject) {
			return roomEntity.domainObject;
		}

		const room: Room = new Room(roomEntity);

		// attach to identity map
		roomEntity.domainObject = room;

		return room;
	}
}
