import { AccessTokenPayload } from '@infra/access-token';
import { AuthorizableReferenceType } from '@modules/authorization';
import { EntityId } from '@shared/domain/types';
import { ValueObject } from '@shared/domain/value-object.decorator';
import { Type } from 'class-transformer';
import { IsEnum, IsMongoId, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { AuthorizationContextVO } from './authorization-context.vo';

@ValueObject()
export class TokenPayload {
	constructor(props: TokenPayload) {
		this.authorizationContext = props.authorizationContext;
		this.referenceType = props.referenceType;
		this.referenceId = props.referenceId;
		this.userId = props.userId;
		this.payload = props.payload || {};
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
	public readonly payload: AccessTokenPayload;
}
