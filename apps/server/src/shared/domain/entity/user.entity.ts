import { Collection, Entity, ManyToMany, Property, Index, Unique } from '@mikro-orm/core';
import type { Role } from './role.entity';
import { EntityId } from '../types';
import { BaseEntityWithTimestamps } from './base.entity';

export interface IUserProperties {
	email: string;
	firstName?: string;
	lastName?: string;
	school: EntityId;
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
	@Property({ fieldName: 'schoolId' })
	school: EntityId;

	constructor(props: IUserProperties) {
		super();
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.email = props.email;
		this.school = props.school;
		this.roles = new Collection<Role>(this, props.roles || []);
	}
}
