import { Embeddable, Embedded, Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';
import { Role } from './role.entity';
import { School } from './school.entity';
import { User } from './user.entity';

export interface ITeamProperties {
	name: string;
	teamUsers?: TeamUser[];
}

@Embeddable()
export class TeamUser {
	constructor(teamUser: TeamUser) {
		this.user = teamUser.user;
		this.role = teamUser.role;
		this.school = teamUser.school;
	}

	@ManyToOne(() => User, { fieldName: 'userId' })
	user: User;

	@ManyToOne(() => Role)
	role: Role;

	@ManyToOne(() => School, { fieldName: 'schoolId' })
	school: School;
}

@Entity({ tableName: 'teams' })
export class Team extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	@Embedded(() => TeamUser, { array: true })
	private userIds: TeamUser[];

	get teamUsers(): TeamUser[] {
		return this.userIds;
	}

	set teamUsers(value: TeamUser[]) {
		this.userIds = value;
	}

	constructor(props: ITeamProperties) {
		super();
		this.name = props.name;
		this.userIds = props.teamUsers ? props.teamUsers.map((teamUser) => new TeamUser(teamUser)) : [];
	}
}
