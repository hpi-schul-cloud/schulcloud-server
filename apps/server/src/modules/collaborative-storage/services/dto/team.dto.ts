/**
 * TODO
 * This DTO and all associated functionality should be moved to a general teams module once it has been created
 */

import { EntityId } from '@shared/domain/types/entity-id';

export class TeamDto {
	id: EntityId;

	name: string;

	teamUsers: TeamUserDto[];

	constructor(props: TeamDto) {
		this.id = props.id;
		this.name = props.name;
		this.teamUsers = props.teamUsers;
	}
}

export class TeamUserDto {
	userId: string;

	roleId: string;

	schoolId: string;

	constructor(props: TeamUserDto) {
		this.userId = props.userId;
		this.roleId = props.roleId;
		this.schoolId = props.schoolId;
	}
}
