import { Entity, Property, Index, Unique } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, EntityId } from '@shared/domain';
import { Role } from './role.entity';

export interface IUserProperties {
	email: string;
	firstName?: string;
	lastName?: string;
	roles: Role[];
	school: EntityId;
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
	// @ManyToMany({ fieldName: 'roles', type: Role })
	// roles = new Collection<Role>(this);
	@Property()
	roles: EntityId[] = [];

	// index
	// collection
	@Index({ name: 'searchUserForSchool' })
	@Property({ fieldName: 'schoolId' })
	school: EntityId;

	constructor(props: IUserProperties) {
		super();
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.email = props.email;
		Object.assign(this, { roles: props.roles, school: props.school });
	}
}
