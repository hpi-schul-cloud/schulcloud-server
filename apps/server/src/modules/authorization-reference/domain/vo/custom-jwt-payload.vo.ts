import { ValueObject } from '@shared/domain/value-object.decorator';
import { IsMongoId, IsString } from 'class-validator';

@ValueObject()
export class CustomJwtPayload {
	constructor(props: unknown) {
		const customJwtPayloadProps = props as CustomJwtPayload;

		this.accountId = customJwtPayloadProps.accountId;
		this.jti = customJwtPayloadProps.jti;
	}

	@IsMongoId()
	public readonly accountId: string;

	@IsString()
	public readonly jti: string;
}
