import { Permission } from '@shared/domain/interface/permission.enum';
import { RoleName } from '@shared/domain/interface/rolename.enum';
import { EntityId } from '@shared/domain/types/entity-id';

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
