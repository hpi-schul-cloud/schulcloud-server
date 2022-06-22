import { Entity, Property, Index } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from './base.entity';

export type IAccountProperties = Readonly<Omit<Account, keyof BaseEntityWithTimestamps>>;

@Entity({ tableName: 'accounts' })
@Index({ properties: ['userId', 'systemId'] })
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

	@Property({ nullable: true, unique: false })
	userId?: ObjectId;

	@Property({ nullable: true })
	systemId?: ObjectId;

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
		this.userId = props.userId;
		this.systemId = props.systemId;
		this.lasttriedFailedLogin = props.lasttriedFailedLogin;
		this.expiresAt = props.expiresAt;
		this.activated = props.activated;
	}
}
