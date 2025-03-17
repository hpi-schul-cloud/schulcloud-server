/* eslint-disable max-classes-per-file */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PrivacyProtect } from '@shared/controller/validator';
import { EntityId } from '@shared/domain/types';
import { IsBoolean, IsDate, IsMongoId, IsNotEmpty, IsString, Matches } from 'class-validator';
import { passwordPattern } from '../../domain';

export class ResolvedAccountDto {
	@ApiPropertyOptional()
	@IsMongoId()
	public readonly id: EntityId;

	@ApiPropertyOptional()
	@IsDate()
	public readonly createdAt?: Date;

	@ApiPropertyOptional()
	@IsDate()
	public readonly updatedAt?: Date;

	@IsString()
	@IsNotEmpty()
	public username: string;

	@PrivacyProtect()
	@ApiPropertyOptional()
	@Matches(passwordPattern)
	public password?: string;

	@ApiPropertyOptional()
	@IsString()
	public token?: string;

	@ApiPropertyOptional()
	@IsString()
	public credentialHash?: string;

	@ApiPropertyOptional()
	@IsMongoId()
	public userId?: EntityId;

	@ApiPropertyOptional()
	@IsMongoId()
	public systemId?: EntityId;

	@ApiPropertyOptional()
	@IsDate()
	public lasttriedFailedLogin?: Date;

	@ApiPropertyOptional()
	@IsDate()
	public expiresAt?: Date;

	@ApiPropertyOptional()
	@IsBoolean()
	public activated?: boolean;

	@ApiPropertyOptional()
	public idmReferenceId?: string;

	@ApiPropertyOptional()
	@IsDate()
	public deactivatedAt?: Date;

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
	public data: ResolvedAccountDto[];

	public total: number;

	public skip?: number;

	public limit?: number;

	constructor(data: ResolvedAccountDto[], total: number, skip?: number, limit?: number) {
		this.data = data;
		this.total = total;
		this.skip = skip;
		this.limit = limit;
	}
}
