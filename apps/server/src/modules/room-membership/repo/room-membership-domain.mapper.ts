import { RoomMembership } from '../do/room-membership.do';
import { RoomMembershipEntity } from './entity';

export class RoomMembershipDomainMapper {
	static mapEntityToDo(roomMembershipEntity: RoomMembershipEntity): RoomMembership {
		// check identity map reference
		if (roomMembershipEntity.domainObject) {
			return roomMembershipEntity.domainObject;
		}

		const roomMember = new RoomMembership(roomMembershipEntity);

		// attach to identity map
		roomMembershipEntity.domainObject = roomMember;

		return roomMember;
	}

	static mapDoToEntity(roomMember: RoomMembership): RoomMembershipEntity {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { props } = roomMember;

		if (!(props instanceof RoomMembershipEntity)) {
			const entity = new RoomMembershipEntity();
			Object.assign(entity, props);

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			roomMember.props = entity;

			return entity;
		}

		return props;
	}
}
