import { CustomPayload } from '@infra/access-token';
import { AuthorizableReferenceType } from '@modules/authorization';
import { EntityId } from '@shared/domain/types';
import { ValueObject } from '@shared/domain/value-object.decorator';
import { Type } from 'class-transformer';
import { IsEnum, IsMongoId, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { AuthorizationContextVO } from './authorization-context.vo';

@ValueObject()
export class TokenMetadata {
	constructor(props: unknown) {
		const tokenMetadataProps = props as TokenMetadata;

		this.authorizationContext = tokenMetadataProps.authorizationContext;
		this.referenceType = tokenMetadataProps.referenceType;
		this.referenceId = tokenMetadataProps.referenceId;
		this.userId = tokenMetadataProps.userId;
		this.customPayload = tokenMetadataProps.customPayload || {};
	}

	@ValidateNested()
	@Type(() => AuthorizationContextVO)
	public readonly authorizationContext: AuthorizationContextVO;

	@IsEnum(AuthorizableReferenceType)
	public readonly referenceType: AuthorizableReferenceType;

	@IsMongoId()
	public readonly referenceId: EntityId;

	@IsMongoId()
	public readonly userId: EntityId;

	@IsObject()
	@IsOptional()
	public readonly customPayload: CustomPayload;
}
