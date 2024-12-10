import { AuthorizableObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { RoleDto } from '@modules/role';

export type UserWithRoomRoles = {
	roles: RoleDto[];
	userId: EntityId;
};

export class RoomMembershipAuthorizable implements AuthorizableObject {
	public readonly id: EntityId = '';

	public readonly roomId: EntityId;

	public readonly members: UserWithRoomRoles[];

	public constructor(roomId: EntityId, members: UserWithRoomRoles[]) {
		this.members = members;
		this.roomId = roomId;
	}
}
