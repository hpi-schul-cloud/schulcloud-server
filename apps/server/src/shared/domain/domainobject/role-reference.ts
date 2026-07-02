import type { RoleName } from '@modules/role'; // TODO: Remove this import when RoleReference is moved to @modules/role
import { EntityId } from '../types';

export class RoleReference {
	id: EntityId;

	name: RoleName;

	constructor(props: RoleReference) {
		this.id = props.id;
		this.name = props.name;
	}
}
