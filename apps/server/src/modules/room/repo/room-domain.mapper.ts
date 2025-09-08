import { Room } from '../domain/do/room.do';
import { RoomEntity } from './entity';

export class RoomDomainMapper {
	static mapEntityToDo(roomEntity: RoomEntity): Room {
		// check identity map reference
		if (roomEntity.domainObject) {
			return roomEntity.domainObject;
		}

		const room = new Room(roomEntity);

		// attach to identity map
		roomEntity.domainObject = room;

		return room;
	}

	static mapDoToEntity(room: Room): RoomEntity {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { props } = room;

		if (!(props instanceof RoomEntity)) {
			const entity = new RoomEntity();
			Object.assign(entity, props);

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			room.props = entity;

			return entity;
		}

		return props;
	}
}
