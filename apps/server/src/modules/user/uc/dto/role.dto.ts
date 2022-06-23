import { Permission, RoleName } from '@shared/domain';

export class RoleDto {
	constructor(role: RoleDto) {
		this.permissions = role.permissions;
		this.roles = role.roles;
		this.name = role.name;
	}

	permissions?: Permission[];

	roles?: RoleDto[];

	name: RoleName;
}
