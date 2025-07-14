import { TypeGuard } from '@shared/common/guards';
import { AuthorizationContext, TokenMetadata } from '../vo';

export class TokenMetadataMapper {
	public static mapFromParamsToTokenMetadata(props: unknown): TokenMetadata {
		const definedObject = TypeGuard.checkDefinedObject(props);
		const authorizationContext = TypeGuard.checkKeyInObject(definedObject, 'context');
		const payload = TypeGuard.checkKeyInObject(definedObject, 'payload');
		const context = new AuthorizationContext(authorizationContext);

		const referenceVo = new TokenMetadata({
			...definedObject,
			authorizationContext: context,
			customPayload: payload,
		});

		return referenceVo;
	}

	public static mapFromServiceResponseToTokenMetadata(props: unknown): TokenMetadata {
		const definedObject = TypeGuard.checkDefinedObject(props);
		const authorizationContext = TypeGuard.checkKeyInObject(definedObject, 'authorizationContext');

		const context = new AuthorizationContext(authorizationContext);

		const referenceVo = new TokenMetadata({
			...definedObject,
			authorizationContext: context,
		});

		return referenceVo;
	}
}
