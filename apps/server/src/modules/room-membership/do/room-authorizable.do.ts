import { RoleDto } from '@modules/role';
import { AuthorizableObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';

export type UserWithRoomRoles = {
	roles: RoleDto[];
	userId: EntityId;
	userSchoolId: EntityId;
};

export class RoomAuthorizable implements AuthorizableObject {
	public readonly id: EntityId = '';

	public readonly roomId: EntityId;

	public readonly schoolId: EntityId;

	public readonly members: UserWithRoomRoles[];

	constructor(roomId: EntityId, members: UserWithRoomRoles[] = [], schoolId: EntityId) {
		this.members = members;
		this.roomId = roomId;
		this.schoolId = schoolId;
	}

	public getRoleOfUser(userId: EntityId): RoleDto | null {
		const member = this.members.find((member) => member.userId === userId);
		return member ? member.roles[0] : null;
	}

	public getRoleNameOfUser(userId: EntityId): string | null {
		const role = this.getRoleOfUser(userId);
		return role ? role.name : null;
	}
}
