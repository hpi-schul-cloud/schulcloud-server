import { type Permission } from '@shared/domain/interface';
import { type EntityId } from '@shared/domain/types';
import { type RoleName } from '../../domain';

export class RoleDto {
	id: EntityId;

	name: RoleName;

	permissions?: Permission[];

	constructor(props: RoleDto) {
		this.id = props.id;
		this.name = props.name;
		this.permissions = props.permissions;
	}
}
