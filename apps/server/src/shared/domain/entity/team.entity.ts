import { Embeddable, Embedded, Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';
import { Role } from './role.entity';
import { School } from '@shared/domain';
import { User } from './user.entity';

export interface ITeamProperties {
	name: string;
	userIds: TeamUser[];
}

@Embeddable()
export class TeamUser extends BaseEntityWithTimestamps {
	constructor(teamUser: TeamUser) {
		super();
		this.userId = teamUser.userId;
		this.role = teamUser.role;
		this.schoolId = teamUser.schoolId;
	}

	@Property()
	userId: User;

	@Property()
	role: Role;

	@Property()
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
		this.userIds = props.userIds;
	}
}
