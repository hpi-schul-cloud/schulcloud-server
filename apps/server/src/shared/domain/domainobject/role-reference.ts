import { RoleName } from '../interface';
import { EntityId } from '../types';

export class RoleReference {
	id: EntityId;

	name: RoleName;

	constructor(props: RoleReference) {
		this.id = props.id;
		this.name = props.name;
	}
}
