/**
 * TODO
 * This DTO and all associated functionality should be moved to a general roles module once it has been created
 */
import { RoleName } from '@shared/domain';

export class RoleDto {
	id?: string;

	name?: RoleName;

	constructor(props: RoleDto) {
		this.id = props.id;
		this.name = props.name;
	}
}
