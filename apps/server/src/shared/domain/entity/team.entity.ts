import { Embeddable, Embedded, Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';
import { Role } from './role.entity';
import { School } from './school.entity';
import { User } from './user.entity';

export interface ITeamProperties {
	name: string;
	teamUsers?: TeamUserEntity[];
}

export interface ITeamUserProperties {
	user: User;
	role: Role;
	school: School;
}

@Embeddable()
export class TeamUserEntity {
	constructor(props: ITeamUserProperties) {
		this.userId = props.user;
		this.role = props.role;
		this.schoolId = props.school;
	}

	@ManyToOne(() => User)
	userId: User;

	@ManyToOne(() => Role)
	role: Role;

	@ManyToOne(() => School)
	private schoolId: School;

	// fieldName cannot be used in ManyToOne on Embeddable due to a mikro-orm bug (https://github.com/mikro-orm/mikro-orm/issues/2165)
	get user(): User {
		return this.userId;
	}

	set user(value: User) {
		this.userId = value;
	}

	get school(): School {
		return this.schoolId;
	}

	set school(value: School) {
		this.schoolId = value;
	}
}

@Entity({ tableName: 'teams' })
export class TeamEntity extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	@Embedded(() => TeamUserEntity, { array: true })
	userIds: TeamUserEntity[];

	get teamUsers(): TeamUserEntity[] {
		return this.userIds;
	}

	set teamUsers(value: TeamUserEntity[]) {
		this.userIds = value;
	}

	constructor(props: ITeamProperties) {
		super();
		this.name = props.name;
		this.userIds = props.teamUsers ? props.teamUsers.map((teamUser) => new TeamUserEntity(teamUser)) : [];
	}
}
