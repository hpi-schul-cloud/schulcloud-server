import { CustomPayload } from '@infra/access-token';
import { AuthorizableReferenceType, AuthorizationContext } from '@modules/authorization';
import { EntityId } from '@shared/domain/types';
import { ValueObject } from '@shared/domain/value-object.decorator';
import { Type } from 'class-transformer';
import { IsEnum, IsMongoId, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

interface TokenMetadataProps {
	authorizationContext: AuthorizationContext;
	referenceType: AuthorizableReferenceType;
	referenceId: EntityId;
	userId: EntityId;
	accountId: EntityId;
	jwtJti: string;
	customPayload?: CustomPayload;
}

@ValueObject()
export class TokenMetadata {
	constructor(props: TokenMetadataProps) {
		this.authorizationContext = props.authorizationContext;
		this.referenceType = props.referenceType;
		this.referenceId = props.referenceId;
		this.userId = props.userId;
		this.accountId = props.accountId;
		this.jwtJti = props.jwtJti;
		this.customPayload = props.customPayload || {};
	}

	@ValidateNested()
	@Type(() => AuthorizationContext)
	public readonly authorizationContext: AuthorizationContext;

	@IsEnum(AuthorizableReferenceType)
	public readonly referenceType: AuthorizableReferenceType;

	@IsMongoId()
	public readonly referenceId: EntityId;

	@IsMongoId()
	public readonly userId: EntityId;

	@IsMongoId()
	public readonly accountId: EntityId;

	@IsString()
	public readonly jwtJti: string;

	@IsObject()
	@IsOptional()
	public readonly customPayload: CustomPayload;
}
