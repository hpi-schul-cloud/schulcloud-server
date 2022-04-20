import { Entity, Property, OneToOne, Index, ManyToOne } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';
import { System } from './system.entity';
import { User } from './user.entity';

export type IAccountProperties = Readonly<Omit<Account, keyof BaseEntityWithTimestamps>>;

@Entity({ tableName: 'accounts' })
@Index({ properties: ['user', 'system'] })
export class Account extends BaseEntityWithTimestamps {
	@Property()
	@Index()
	username!: string;

	@Property({ nullable: true })
	password?: string;

	@Property({ nullable: true })
	token?: string;

	@Property({ nullable: true })
	credentialHash?: string;

	@OneToOne({ entity: () => User, fieldName: 'userId' })
	user: User;

	@ManyToOne({ entity: () => System, fieldName: 'systemId', nullable: true })
	system?: System;

	@Property({ nullable: true })
	lasttriedFailedLogin?: Date;

	@Property({ nullable: true })
	expiresAt?: Date;

	@Property({ nullable: true })
	activated?: boolean;

	constructor(props: IAccountProperties) {
		super();
		this.username = props.username;
		this.password = props.password;
		this.token = props.token;
		this.credentialHash = props.credentialHash;
		this.user = props.user;
		this.system = props.system;
		this.lasttriedFailedLogin = props.lasttriedFailedLogin;
		this.expiresAt = props.expiresAt;
		this.activated = props.activated;
	}
}
