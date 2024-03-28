import { EntityId } from '@shared/domain/types';
import { IsBoolean, IsDate, IsMongoId, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { PrivacyProtect } from '@shared/controller';
import { passwordPattern } from '../../controller/dto/password-pattern';

export class ResolvedAccountDto {
	@IsOptional()
	@IsMongoId()
	readonly id: EntityId;

	@IsOptional()
	@IsDate()
	readonly createdAt?: Date;

	@IsOptional()
	@IsDate()
	readonly updatedAt?: Date;

	@IsString()
	@IsNotEmpty()
	username: string;

	@PrivacyProtect()
	@IsOptional()
	@Matches(passwordPattern)
	password?: string;

	@IsOptional()
	@IsString()
	token?: string;

	@IsOptional()
	@IsString()
	credentialHash?: string;

	@IsOptional()
	@IsMongoId()
	userId?: EntityId;

	@IsOptional()
	@IsMongoId()
	systemId?: EntityId;

	@IsOptional()
	@IsDate()
	lasttriedFailedLogin?: Date;

	@IsOptional()
	@IsDate()
	expiresAt?: Date;

	@IsOptional()
	@IsBoolean()
	activated?: boolean;

	@IsOptional()
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
