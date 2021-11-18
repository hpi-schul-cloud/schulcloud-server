import { Collection, Entity, ManyToMany, ManyToOne, Property, Index, Unique } from '@mikro-orm/core';
import type { Role } from './role.entity';
import type { School } from './school.entity';
import { BaseEntityWithTimestamps } from './base.entity';

export interface IUserProperties {
	email: string;
	firstName?: string;
	lastName?: string;
	school: School;
	roles: Role[];
}

@Entity({ tableName: 'users' })
export class User extends BaseEntityWithTimestamps {
	@Property()
	@Index({ name: 'externalUserIdentifier' })
	@Unique()
	email: string;

	@Property()
	firstName?: string;

	@Property()
	lastName?: string;

	@Index({ name: 'roleIdBasedSearches' })
	@ManyToMany('Role', undefined, { fieldName: 'roles' })
	roles = new Collection<Role>(this);

	@Index({ name: 'searchUserForSchool' })
	@ManyToOne('School', { fieldName: 'schoolId' })
	school!: School;

	constructor(props: IUserProperties) {
		super();
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.email = props.email;
		this.school = props.school;
		this.roles.set(props.roles);
	}
}
