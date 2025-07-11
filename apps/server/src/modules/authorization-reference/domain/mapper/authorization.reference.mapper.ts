import { TypeGuard } from '@shared/common/guards';
import { AuthorizationContext, TokenMetadata } from '../vo';

export class TokenMetadataMapper {
	public static mapToTokenMetadata(props: unknown): TokenMetadata {
		const definedObject = TypeGuard.checkDefinedObject(props);
		const authorizationContext = TypeGuard.checkKeyInObject(definedObject, 'authorizationContext');

		const context = new AuthorizationContext(authorizationContext);

		const referenceVo = new TokenMetadata({
			authorizationContext: context,
			...definedObject,
		});

		return referenceVo;
	}
}
