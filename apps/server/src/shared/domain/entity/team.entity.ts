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
		this.userId = teamUser.userId;
		this.role = teamUser.role;
		this.schoolId = teamUser.schoolId;
	}

	// TODO rename field name to 'user' and 'school' to understand the variables better
	// fieldName cannot be used in ManyToOne on Embeddable due to a mikro-orm bug (https://github.com/mikro-orm/mikro-orm/issues/2165)
	@ManyToOne(() => User)
	userId: User;

	@ManyToOne(() => Role)
	role: Role;

	@ManyToOne(() => School)
	schoolId: School;
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
