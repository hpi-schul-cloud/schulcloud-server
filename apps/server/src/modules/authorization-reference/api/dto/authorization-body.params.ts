import { accessTokenRegex, CustomPayload, NanoidString24Chars } from '@infra/access-token';
import { Action, AuthorizableReferenceType, AuthorizationContext } from '@modules/authorization';
import { ApiProperty } from '@nestjs/swagger';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsMongoId, IsNumber, IsObject, IsOptional, Matches, ValidateNested } from 'class-validator';

class AuthorizationContextParams implements AuthorizationContext {
	@IsEnum(Action)
	@ApiProperty({
		name: 'action',
		enum: Action,
		description: 'Define for which action the operation should be performend.',
		example: Action.read,
	})
	public action!: Action;

	@IsArray()
	@IsEnum(Permission, { each: true })
	@ApiProperty({
		name: 'requiredPermissions',
		enum: Permission,
		isArray: true,
		description: 'User permissions that are needed to execute the operation.',
		example: [Permission.USER_UPDATE],
	})
	public requiredPermissions!: Permission[];
}

export class AuthorizationBodyParams {
	@ValidateNested()
	@Type(() => AuthorizationContextParams)
	@ApiProperty({
		type: AuthorizationContextParams,
	})
	public context!: AuthorizationContextParams;

	@IsEnum(AuthorizableReferenceType)
	@ApiProperty({
		enum: AuthorizableReferenceType,
		description: 'The entity or domain object the operation should be performed on.',
		example: AuthorizableReferenceType.User,
	})
	public referenceType!: AuthorizableReferenceType;

	@IsMongoId()
	@ApiProperty({ description: 'The id of the entity/domain object of the defined referenceType.' })
	public referenceId!: EntityId;
}

export class AuthorizationManyReferencesBodyParams {
	@ApiProperty({
		type: [AuthorizationBodyParams],
		description: 'List of references to authorize against.',
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => AuthorizationBodyParams)
	public references!: AuthorizationBodyParams[];
}

export class CreateAccessTokenParams extends AuthorizationBodyParams {
	@ApiProperty({ description: 'Lifetime of token' })
	@IsNumber()
	public tokenTtlInSeconds!: number;

	@ApiProperty({ description: 'The payload of the access token.' })
	@IsObject()
	@IsOptional()
	public payload: CustomPayload = {};
}

export class AccessTokenParams {
	@ApiProperty({ description: 'The access token to be resolved.' })
	@Matches(accessTokenRegex, { message: 'Token must be a valid access token string.' })
	public token!: NanoidString24Chars;

	@ApiProperty({ description: 'Lifetime of token' })
	@IsNumber()
	public tokenTtlInSeconds!: number;
}
