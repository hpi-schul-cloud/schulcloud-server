export class GroupDto {
	id: string;

	name: string;

	constructor(group: GroupDto) {
		this.id = group.id;
		this.name = group.name;
	}
}
