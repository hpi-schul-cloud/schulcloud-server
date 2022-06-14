/**
 * TODO
 * This DTO and all associated functionality should be moved to a general roles module once it has been created
 */

export class RoleDto {
	id?: string;

	name?: string;

	constructor(props: RoleDto) {
		this.id = props.id;
		this.name = props.name;
	}
}
