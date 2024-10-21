import { AuthorizableObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { RoleDto } from '@src/modules/role';

export type UserWithRoomRoles = {
	roles: RoleDto[];
	userId: EntityId;
};

export class RoomMemberAuthorizable implements AuthorizableObject {
	public readonly id: EntityId;

	public readonly members: UserWithRoomRoles[];

	public constructor(members: UserWithRoomRoles[]) {
		this.id = '';
		this.members = members;
	}
}
