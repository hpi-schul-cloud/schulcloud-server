import { RoleName } from '../interface/rolename.enum';
import { EntityId } from '../types/entity-id';

export class RoleReference {
	id: EntityId;

	name: RoleName;

	constructor(props: RoleReference) {
		this.id = props.id;
		this.name = props.name;
	}
}
