import { CustomPayload } from '@infra/access-token';
import { AuthorizableReferenceType, AuthorizationContext } from '@modules/authorization';
import { EntityId } from '@shared/domain/types';
import { AuthorizationContextVO } from '../vo/authorization-context.vo';
import { TokenMetadata } from '../vo/token-metadata';

export class TokenMetadataMapper {
	public static mapToTokenMetadata(
		authorizationContext: AuthorizationContext,
		referenceType: AuthorizableReferenceType,
		referenceId: EntityId,
		userId: EntityId,
		payload: CustomPayload
	): TokenMetadata {
		const context = new AuthorizationContextVO(authorizationContext);

		const referenceVo = new TokenMetadata({
			authorizationContext: context,
			referenceType,
			referenceId,
			userId,
			customPayload: payload || {},
		});

		return referenceVo;
	}
}
