import { EntityId } from '@shared/domain/types';

export class ResolvedAccountDto {
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

	constructor(account: ResolvedAccountDto) {
		this.id = account.id;
		this.username = account.username;
		this.userId = account.userId;
		this.activated = account.activated;
		this.updatedAt = account.updatedAt;
		this.createdAt = account.createdAt;
		this.systemId = account.systemId;
		this.password = account.password;
		this.token = account.token;
		this.credentialHash = account.credentialHash;
		this.lasttriedFailedLogin = account.lasttriedFailedLogin;
		this.expiresAt = account.expiresAt;
		this.idmReferenceId = account.idmReferenceId;
	}
}

export class ResolvedSearchListAccountDto {
	data: ResolvedAccountDto[];
	total: number;
	skip?: number;
	limit?: number;

	constructor(data: ResolvedAccountDto[], total: number, skip?: number, limit?: number) {
		this.data = data;
		this.total = total;
		this.skip = skip;
		this.limit = limit;
	}
}
