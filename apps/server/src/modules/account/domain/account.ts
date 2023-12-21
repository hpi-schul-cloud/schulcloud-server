import { th } from '@faker-js/faker';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';

export interface AccountProps extends AuthorizableObject {
	id: EntityId;
	updatedAt?: Date;
	createdAt?: Date;
	userId?: EntityId;
	systemId?: EntityId;
	username?: string;
	password?: string;
	token?: string;
	credentialHash?: string;
	lasttriedFailedLogin?: Date;
	expiresAt?: Date;
	activated?: boolean;
	idmReferenceId?: string;
}

export class Account extends DomainObject<AccountProps> {
	get id(): EntityId {
		return this.props.id;
	}

	get createdAt(): Date | undefined {
		return this.props.createdAt;
	}

	get updatedAt(): Date | undefined {
		return this.props.updatedAt;
	}

	get userId(): EntityId | undefined {
		return this.props.userId;
	}

	get systemId(): EntityId | undefined {
		return this.props.systemId;
	}

	set systemId(systemId: EntityId | undefined) {
		this.props.systemId = systemId;
	}

	get username(): string | undefined {
		return this.props.username;
	}

	set username(username: string | undefined) {
		this.props.username = username;
	}

	get password(): string | undefined {
		return this.props.password;
	}

	public set password(password: string | undefined) {
		// if (this.props.systemId)
		this.props.password = password;
	}

	get token(): string | undefined {
		return this.props.token;
	}

	get credentialHash(): string | undefined {
		return this.props.credentialHash;
	}

	get lasttriedFailedLogin(): Date | undefined {
		return this.props.lasttriedFailedLogin;
	}

	get expiresAt(): Date | undefined {
		return this.props.expiresAt;
	}

	get activated(): boolean | undefined {
		return this.props.activated;
	}

	set activated(activated: boolean | undefined) {
		this.props.activated = activated;
	}

	get idmReferenceId(): string | undefined {
		return this.props.idmReferenceId;
	}

}
