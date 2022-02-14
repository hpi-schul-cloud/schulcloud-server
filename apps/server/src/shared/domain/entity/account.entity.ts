import { Entity, Property, OneToOne } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from './base.entity';
import { System } from './system.entity';
import { User } from './user.entity';

export type IAccountProperties = Readonly<Omit<Account, keyof BaseEntityWithTimestamps>>;

@Entity({ tableName: 'account' })
export class Account extends BaseEntityWithTimestamps {
	@Property()
	username!: string;

	@Property({ nullable: true })
	password?: string;

	@Property({ nullable: true })
	token?: string;

	@Property({ nullable: true })
	credentialHash?: string;

	@OneToOne({ entity: () => User, owner: true, orphanRemoval: true, mapToPk: true, index: true })
	userId!: ObjectId;

	@OneToOne({ entity: () => System, owner: true, orphanRemoval: true, mapToPk: true, nullable: true })
	systemId?: ObjectId;

	@Property({ nullable: true })
	lasttriedFailedLogin? = new Date(0);

	@Property({ nullable: true })
	expiresAt?: Date;

	@Property({ nullable: true })
	activated? = false;

	constructor(props: IAccountProperties) {
		super();
		this.username = props.username;
		this.password = props.password;
		this.token = props.token;
		this.credentialHash = props.credentialHash;
		this.userId = props.userId;
		this.systemId = props.systemId;
		this.lasttriedFailedLogin = props.lasttriedFailedLogin;
		this.expiresAt = props.expiresAt;
		this.activated = props.activated;
	}
}
