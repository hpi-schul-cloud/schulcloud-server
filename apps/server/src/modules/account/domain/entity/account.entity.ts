import { Entity, Property, Index } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';

export type IdmAccountProperties = Readonly<Omit<AccountEntity, keyof BaseEntityWithTimestamps>>;

@Entity({ tableName: 'accounts' })
@Index({ properties: ['userId', 'systemId'] })
export class AccountEntity extends BaseEntityWithTimestamps {
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
	lastLogin?: Date;

	@Property({ nullable: true })
	lasttriedFailedLogin?: Date;

	@Property({ nullable: true })
	expiresAt?: Date;

	@Property({ nullable: true })
	activated?: boolean;

	@Property({ nullable: true })
	deactivatedAt?: Date;

	constructor(props: IdmAccountProperties) {
		super();
		this.username = props.username;
		this.password = props.password;
		this.token = props.token;
		this.credentialHash = props.credentialHash;
		this.userId = props.userId;
		this.systemId = props.systemId;
		this.lasttriedFailedLogin = props.lasttriedFailedLogin;
		this.lastLogin = props.lastLogin;
		this.expiresAt = props.expiresAt;
		this.activated = props.activated;
		this.deactivatedAt = props.deactivatedAt;
	}
}
