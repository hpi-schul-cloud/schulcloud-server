import { ObjectId } from '@mikro-orm/mongodb';
import { GroupUserEmbeddable } from '@src/modules/group/entity';
import { RoomMember } from '../do/room-member.do';
import { RoomMemberEntity } from './entity/room-member.entity';

export class RoomMemberDomainMapper {
	private static mapGroupUserEmbeddableToMembers(groupUserEmbeddable: GroupUserEmbeddable[]): RoomMember['members'] {
		return groupUserEmbeddable.map((user) => {
			return {
				userId: new ObjectId(user.user.id),
				role: user.role,
			};
		});
	}

	static mapEntityToDo(roomMemberEntity: RoomMemberEntity, userGroup: GroupUserEmbeddable[]): RoomMember {
		// check identity map reference
		if (roomMemberEntity.domainObject) {
			return roomMemberEntity.domainObject;
		}

		const members = RoomMemberDomainMapper.mapGroupUserEmbeddableToMembers(userGroup);
		const roomMember = new RoomMember({
			id: roomMemberEntity.id,
			roomId: roomMemberEntity.roomId,
			userGroupId: roomMemberEntity.userGroupId,
			members,
			createdAt: roomMemberEntity.createdAt,
			updatedAt: roomMemberEntity.updatedAt,
		});

		// attach to identity map
		roomMemberEntity.domainObject = roomMember;

		return roomMember;
	}

	static mapDoToEntity(roomMember: RoomMember): RoomMemberEntity {
		const entity = new RoomMemberEntity();
		const { members, ...rest } = roomMember.getProps();
		Object.assign(entity, { ...rest });

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		roomMember.props = entity;

		return entity;
	}
}
