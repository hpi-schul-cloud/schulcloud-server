import { RoomMember } from '../do/room-member.do';
import { RoomMemberEntity } from './entity';

export class RoomMemberDomainMapper {
	static mapEntityToDo(roomMemberEntity: RoomMemberEntity): RoomMember {
		// check identity map reference
		if (roomMemberEntity.domainObject) {
			return roomMemberEntity.domainObject;
		}

		const roomMember = new RoomMember(roomMemberEntity);

		// attach to identity map
		roomMemberEntity.domainObject = roomMember;

		return roomMember;
	}

	static mapDoToEntity(roomMember: RoomMember): RoomMemberEntity {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { props } = roomMember;

		if (!(props instanceof RoomMemberEntity)) {
			const entity = new RoomMemberEntity();
			Object.assign(entity, props);

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			roomMember.props = entity;

			return entity;
		}

		return props;
	}
}
