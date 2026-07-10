import type { RoleName } from '@modules/role'; // TODO: Remove this import when RoleReference is moved to @modules/role
import { type EntityId } from '../types';

export class RoleReference {
	public id: EntityId;

	public name: RoleName;

	constructor(props: RoleReference) {
		this.id = props.id;
		this.name = props.name;
	}
}
