import { ApiPropertyOptional } from '@nestjs/swagger';
import { PrivacyProtect } from '@shared/controller/validator';
import { EntityId } from '@shared/domain/types';
import { IsBoolean, IsDate, IsMongoId, IsNotEmpty, IsString, Matches } from 'class-validator';
import { passwordPattern } from '../../domain';

export class ResolvedAccountDto {
	@ApiPropertyOptional()
	@IsMongoId()
	readonly id: EntityId;

	@ApiPropertyOptional()
	@IsDate()
	readonly createdAt?: Date;

	@ApiPropertyOptional()
	@IsDate()
	readonly updatedAt?: Date;

	@IsString()
	@IsNotEmpty()
	username: string;

	@PrivacyProtect()
	@ApiPropertyOptional()
	@Matches(passwordPattern)
	password?: string;

	@ApiPropertyOptional()
	@IsString()
	token?: string;

	@ApiPropertyOptional()
	@IsString()
	credentialHash?: string;

	@ApiPropertyOptional()
	@IsMongoId()
	userId?: EntityId;

	@ApiPropertyOptional()
	@IsMongoId()
	systemId?: EntityId;

	@ApiPropertyOptional()
	@IsDate()
	lasttriedFailedLogin?: Date;

	@ApiPropertyOptional()
	@IsDate()
	expiresAt?: Date;

	@ApiPropertyOptional()
	@IsBoolean()
	activated?: boolean;

	@ApiPropertyOptional()
	idmReferenceId?: string;

	@ApiPropertyOptional()
	@IsDate()
	deactivatedAt?: Date;

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
		this.deactivatedAt = account.deactivatedAt;
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
