/* istanbul ignore file */
// TODO add tests to improve coverage

import { Entity, ManyToOne, Property, Collection } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';
import type { User } from './user.entity';

@Entity({ tableName: 'accounts' })
export class Account extends BaseEntityWithTimestamps {
	constructor(partial: Partial<Account>) {
		super();
		// TODO not use partial see INewsProperties, use Object.assign for related entities only.
		Object.assign(this, partial);
	}

	@Property()
	username: string;
	/*
	@Property()
	password: string; // hash and secret inside the application
	*/

	@ManyToOne('User', { fieldName: 'userId' })
	user = new Collection<User>(this);

	@Property()
	lasttriedFailedLogin: Date; // iso date

	// sso keys
}
