import { Entity, Property, Index, Unique } from '@mikro-orm/core';
import { EntityId } from '../types';
import { BaseEntityWithTimestamps } from './base.entity';

export interface IUserProperties {
	email: string;
	firstName: string;
	lastName: string;
	school: EntityId;
}

@Entity({ tableName: 'users' })
export class User extends BaseEntityWithTimestamps {
	@Property()
	@Index({ name: 'externalUserIdentifier' })
	@Unique()
	email: string;

	@Property()
	firstName: string;

	@Property()
	lastName: string;

	@Index({ name: 'searchUserForSchool' })
	@Property({ fieldName: 'schoolId' })
	school: EntityId;

	constructor(props: IUserProperties) {
		super();
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.email = props.email;
		this.school = props.school;

		Object.assign(this, {});
	}
}
