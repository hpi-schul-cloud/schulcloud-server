import { Embeddable, Embedded, Entity, ManyToOne, Property } from '@mikro-orm/core';
// eslint-disable-next-line import/no-cycle
import { School } from '@shared/domain';
import { BaseEntityWithTimestamps } from './base.entity';
import { Role } from './role.entity';
import { User } from './user.entity';

export interface ITeamProperties {
	name: string;
	userIds?: TeamUser[];
}

@Embeddable()
export class TeamUser {
	constructor(teamUser: TeamUser) {
		this.userId = teamUser.userId;
		this.role = teamUser.role;
		this.schoolId = teamUser.schoolId;
	}

	@ManyToOne({ entity: () => Role })
	userId: User;

	@ManyToOne({ entity: () => Role })
	role: Role;

	@ManyToOne({ entity: () => School })
	schoolId: School;
}

@Entity({ tableName: 'teams' })
export class Team extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	@Embedded(() => TeamUser, { array: true })
	userIds: TeamUser[];

	constructor(props: ITeamProperties) {
		super();
		this.name = props.name;
		this.userIds = props.userIds ? props.userIds.map((teamUser) => new TeamUser(teamUser)) : [];
	}
}
