import { EntityId, Permission, RoleName } from '@shared/domain';

export class RoleDto {
	id?: EntityId;

	name: RoleName;

	permissions?: Permission[];

	constructor(props: RoleDto) {
		this.id = props.id;
		this.name = props.name;
		this.permissions = props.permissions;
	}
}
