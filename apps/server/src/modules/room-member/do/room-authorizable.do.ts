import { AuthorizableObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { RoleDto } from '@src/modules/role';

export class RoomMemberAuthorizable implements AuthorizableObject {
	public readonly id: EntityId;

	public readonly roles: RoleDto[];

	public readonly userId: EntityId;

	public constructor(roles: RoleDto[], userId: EntityId) {
		this.id = '';
		this.roles = roles;
		this.userId = userId;
	}
}
