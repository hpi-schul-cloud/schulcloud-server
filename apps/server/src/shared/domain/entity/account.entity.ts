/* istanbul ignore file */
// TODO add tests to improve coverage

import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';
import type { User } from './user.entity';

interface IAccountProperties {
	username: string;
	user: User;
}

@Entity({ tableName: 'accounts' })
export class Account extends BaseEntityWithTimestamps {
	@Property()
	username: string;
	/*
	@Property()
	password: string; // hash and secret inside the application
	*/

	@ManyToOne('User', { fieldName: 'userId' })
	user: User;

	@Property()
	lasttriedFailedLogin: Date; // iso date

	// sso keys

	constructor(props: IAccountProperties) {
		super();
		this.username = props.username;
		this.user = props.user;
	}
}
