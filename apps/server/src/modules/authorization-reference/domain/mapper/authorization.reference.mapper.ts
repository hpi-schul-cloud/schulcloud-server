import { TypeGuard } from '@shared/common/guards';
import { TokenMetadata } from '../vo';
import { AuthorizationContextVO } from '../vo/authorization-context.vo';

export class TokenMetadataMapper {
	public static mapToTokenMetadata(props: unknown): TokenMetadata {
		const definedObject = TypeGuard.checkDefinedObject(props);
		const authorizationContext = TypeGuard.checkKeyInObject(definedObject, 'authorizationContext');

		const context = new AuthorizationContextVO(authorizationContext);

		const referenceVo = new TokenMetadata({
			authorizationContext: context,
			...definedObject,
		});

		return referenceVo;
	}
}
