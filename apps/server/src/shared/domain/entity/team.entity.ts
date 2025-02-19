import { Embeddable, Embedded, Entity, ManyToOne, Property } from '@mikro-orm/core';
import { SchoolEntity } from '@modules/school/repo';
import { BaseEntityWithTimestamps } from './base.entity';
import { Role } from './role.entity';
import { User } from './user.entity';

export interface TeamProperties {
	name: string;
	teamUsers?: TeamUserEntity[];
}

export interface TeamUserProperties {
	user: User;
	role: Role;
	school: SchoolEntity;
}

@Embeddable()
export class TeamUserEntity {
	constructor(props: TeamUserProperties) {
		this.userId = props.user;
		this.role = props.role;
		this.schoolId = props.school;
	}

	@ManyToOne(() => User)
	userId: User;

	@ManyToOne(() => Role)
	role: Role;

	@ManyToOne(() => SchoolEntity)
	private schoolId: SchoolEntity;

	// fieldName cannot be used in ManyToOne on Embeddable due to a mikro-orm bug (https://github.com/mikro-orm/mikro-orm/issues/2165)
	get user(): User {
		return this.userId;
	}

	set user(value: User) {
		this.userId = value;
	}

	get school(): SchoolEntity {
		return this.schoolId;
	}

	set school(value: SchoolEntity) {
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

	constructor(props: TeamProperties) {
		super();
		this.name = props.name;
		this.userIds = props.teamUsers ? props.teamUsers.map((teamUser) => new TeamUserEntity(teamUser)) : [];
	}
}
