import { EntityId } from '@shared/domain/types';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';

export interface AccountProps extends AuthorizableObject {
	id: string;

	createdAt: Date;

	updatedAt: Date;

	username: string;

	password?: string;

	token?: string;

	credentialHash?: string;

	userId?: EntityId;

	systemId?: EntityId;

	lasttriedFailedLogin?: Date;

	expiresAt?: Date;

	activated?: boolean;

	idmReferenceId?: string;
}

export class Account extends DomainObject<AccountProps> {
	get id(): EntityId {
		return this.props.id;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	get username(): string {
		return this.props.username;
	}

	setUsername(username: string): void {
		this.props.username = username;
	}

	password?: string;

	token?: string;

	credentialHash?: string;

	userId?: EntityId;

	systemId?: EntityId;

	lasttriedFailedLogin?: Date;

	expiresAt?: Date;

	activated?: boolean;

	idmReferenceId?: string;
}
