import { type EntityId } from '@shared/domain/types';
import { TeamUserDto } from './team-user.dto';

/**
 * TODO
 * This DTO and all associated functionality should be moved to a general teams module once it has been created
 */

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
