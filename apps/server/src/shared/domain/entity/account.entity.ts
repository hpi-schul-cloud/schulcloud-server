import { Entity, Property, Index, ManyToOne, ManyToMany, Collection } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';

export interface IAccountProperties {
	username: string;
	password: string;
	lasttriedFailedLogin: Date;
}

@Entity({ tableName: 'account' })
export class Account extends BaseEntityWithTimestamps {
	@Property()
	username: string;

	@Property()
	password: string;

	@Property()
	lasttriedFailedLogin: Date;

	constructor(props: IAccountProperties) {
		super();
		this.username = props.username;
		this.password = props.password;
		this.lasttriedFailedLogin = props.lasttriedFailedLogin;
	}
}
