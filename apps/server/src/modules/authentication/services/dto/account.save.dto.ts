import { EntityId } from '@shared/domain';

export class AccountSaveDto {
	readonly id?: EntityId;

	readonly createdAt?: Date;

	readonly updatedAt?: Date;

	username: string;

	password?: string;

	token?: string;

	credentialHash?: string;

	userId: EntityId;

	systemId?: EntityId;

	lasttriedFailedLogin?: Date;

	expiresAt?: Date;

	activated?: boolean;

	constructor(props: AccountSaveDto) {
		this.id = props.id;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
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
