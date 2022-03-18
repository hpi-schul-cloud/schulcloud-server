import { Collection, Entity, ManyToMany, ManyToOne, Property, Index, Unique } from '@mikro-orm/core';
import type { Role } from './role.entity';
import type { School } from './school.entity';
import { BaseEntityWithTimestamps } from './base.entity';

export interface IUserProperties {
	email: string;
	firstName: string;
	lastName: string;
	school: School;
	roles: Role[];
	ldapId?: string;
}

@Entity({ tableName: 'users' })
@Index({ properties: ['id', 'email'] })
@Index({ properties: ['firstName', 'lastName'] })
@Index({ properties: ['ldapId', 'school'] })
@Index({ properties: ['school', 'roles'] })
export class User extends BaseEntityWithTimestamps {
	@Property()
	@Index()
	// @Unique()
	email: string;

	@Property()
	firstName: string;

	@Property()
	lastName: string;

	@Index()
	@ManyToMany('Role', undefined, { fieldName: 'roles' })
	roles = new Collection<Role>(this);

	@Index()
	@ManyToOne('School', { fieldName: 'schoolId' })
	school: School;

	@Property({ nullable: true })
	@Index()
	ldapId?: string;

	constructor(props: IUserProperties) {
		super();
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.email = props.email;
		this.school = props.school;
		this.roles.set(props.roles);
		this.ldapId = props.ldapId;
	}
}
