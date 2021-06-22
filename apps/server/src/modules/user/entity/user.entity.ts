import { Entity, ManyToMany, Property, Collection } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { Role } from './role.entity';

@Entity({ tableName: 'users' })
export class User extends BaseEntityWithTimestamps {
	constructor(partial: Partial<User>) {
		super();
		Object.assign(this, partial);
	}

	@Property()
	email: string;

	@Property()
	firstName: string;

	@Property()
	lastName: string;

	// @ManyToOne({ fieldName: 'schoolId' }) // oneToMany?
	// school: SchoolUserInfo;

	@ManyToMany({ fieldName: 'roles', type: Role })
	roles = new Collection<Role>(this);
}
