import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import bcrypt from 'bcryptjs';
import { AccountSave } from './account-save';

export interface AccountProps extends AuthorizableObject {
	id: EntityId;
	updatedAt?: Date;
	createdAt?: Date;
	userId?: EntityId;
	systemId?: EntityId;
	username: string;
	password?: string;
	token?: string;
	credentialHash?: string;
	lastLogin?: Date;
	lasttriedFailedLogin?: Date;
	expiresAt?: Date;
	activated?: boolean;
	idmReferenceId?: string;
	deactivatedAt?: Date;
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

	set userId(userId: EntityId | undefined) {
		this.props.userId = userId;
	}

	get systemId(): EntityId | undefined {
		return this.props.systemId;
	}

	set systemId(systemId: EntityId | undefined) {
		this.props.systemId = systemId;
	}

	get username(): string {
		return this.props.username;
	}

	set username(username: string) {
		this.props.username = username;
	}

	get password(): string | undefined {
		return this.props.password;
	}

	set password(password: string | undefined) {
		this.props.password = password;
	}

	get token(): string | undefined {
		return this.props.token;
	}

	get credentialHash(): string | undefined {
		return this.props.credentialHash;
	}

	get lastLogin(): Date | undefined {
		return this.props.lastLogin;
	}

	set lastLogin(lastLogin: Date | undefined) {
		this.props.lastLogin = lastLogin;
	}

	get lasttriedFailedLogin(): Date | undefined {
		return this.props.lasttriedFailedLogin;
	}

	set lasttriedFailedLogin(lasttriedFailedLogin: Date | undefined) {
		this.props.lasttriedFailedLogin = lasttriedFailedLogin;
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

	get deactivatedAt(): Date | undefined {
		return this.props.deactivatedAt;
	}

	set deactivatedAt(deactivatedAt: Date | undefined) {
		this.props.deactivatedAt = deactivatedAt;
	}

	public async update(accountSave: AccountSave): Promise<void> {
		this.props.userId = accountSave.userId ?? this.props.userId;
		this.props.systemId = accountSave.systemId ?? this.props.systemId;
		this.props.username = accountSave.username ?? this.props.username;
		this.props.activated = accountSave.activated ?? this.props.activated;
		this.props.expiresAt = accountSave.expiresAt ?? this.props.expiresAt;
		this.props.lasttriedFailedLogin = accountSave.lasttriedFailedLogin ?? this.props.lasttriedFailedLogin;
		this.props.credentialHash = accountSave.credentialHash ?? this.props.credentialHash;
		this.props.token = accountSave.token ?? this.props.token;
		this.props.deactivatedAt = accountSave.deactivatedAt ?? this.props.deactivatedAt;

		if (accountSave.password) {
			this.props.password = await this.encryptPassword(accountSave.password);
		}
	}

	private encryptPassword(password: string): Promise<string> {
		return bcrypt.hash(password, 10);
	}
}
