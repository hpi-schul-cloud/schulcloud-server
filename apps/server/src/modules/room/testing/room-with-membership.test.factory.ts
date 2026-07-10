import { type GroupEntity, GroupEntityTypes } from '@modules/group/entity';
import { type RoomProps } from '../domain';
import { type RoomMembershipEntity } from '@modules/room-membership';
import { type SchoolEntity } from '@modules/school/repo';
import { type Role } from '@modules/role/repo';
import { type User } from '@modules/user/repo';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { roomEntityFactory } from './room-entity.factory';
import { type RoomEntity } from '../repo';

type CreateRoomWithUserGroupReturn = {
	roomEntity: RoomEntity;
	userGroup: GroupEntity;
	roomMembership: RoomMembershipEntity;
};

export const createRoomWithUserGroup = (
	school: SchoolEntity,
	users: Array<{ role: Role; user: User }>,
	roomProps: Partial<RoomProps> = {}
): CreateRoomWithUserGroupReturn => {
	const roomEntity = roomEntityFactory.buildWithId({ ...roomProps, schoolId: school.id });
	const userGroup = groupEntityFactory.buildWithId({
		users,
		type: GroupEntityTypes.ROOM,
		organization: school,
		externalSource: undefined,
	});
	const roomMembership = roomMembershipEntityFactory.buildWithId({
		userGroupId: userGroup.id,
		roomId: roomEntity.id,
		schoolId: school.id,
	});

	return { roomEntity, userGroup, roomMembership };
};
