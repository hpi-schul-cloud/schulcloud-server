/**
 * TODO
 * This DTO and all associated functionality should be moved to a general teams module once it has been created
 */

export class TeamDto {
	id?: string;

	name?: string;

	userIds!: TeamUserDto[];

	constructor(props: TeamDto) {
		this.id = props.id;
		this.name = props.name;
		this.userIds = props.userIds;
	}
}

export class TeamUserDto {
	userId: string;

	role: string;

	schoolId: string;

	constructor(props: TeamUserDto) {
		this.userId = props.userId;
		this.role = props.role;
		this.schoolId = props.schoolId;
	}
}
