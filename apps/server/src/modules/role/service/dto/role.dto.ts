import { Permission, RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';

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
