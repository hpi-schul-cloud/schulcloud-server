import { EntityId } from '@shared/domain';

export class AccountCreateDto {
	username: string;

	password?: string;

	token?: string;

	credentialHash?: string;

	userId: EntityId;

	systemId?: EntityId;

	lasttriedFailedLogin?: Date;

	expiresAt?: Date;

	activated?: boolean;

	constructor(props: AccountCreateDto) {
		this.username = props.username;
		this.password = props.password;
		this.credentialHash = props.credentialHash;
		this.token = props.token;
		this.userId = props.userId;
		this.systemId = props.systemId;
		this.lasttriedFailedLogin = props.lasttriedFailedLogin;
		this.expiresAt = props.expiresAt;
		this.activated = props.activated;
	}
}
