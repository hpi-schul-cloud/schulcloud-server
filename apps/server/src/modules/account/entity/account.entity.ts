import { Entity, Property, Index } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';

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
	userId?: EntityId;

	@Property({ nullable: true })
	systemId?: EntityId;

	@Property({ nullable: true })
	lasttriedFailedLogin?: Date;

	@Property({ nullable: true })
	expiresAt?: Date;

	@Property({ nullable: true })
	activated?: boolean;

	constructor(props: IdmAccountProperties) {
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
