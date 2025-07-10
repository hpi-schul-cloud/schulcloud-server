import { AccessTokenPayload } from '@infra/access-token';
import { AuthorizableReferenceType, AuthorizationContext } from '@modules/authorization';
import { EntityId } from '@shared/domain/types';
import { AuthorizationContextVO } from '../vo/authorization-context.vo';
import { TokenPayload } from '../vo/authorization-reference.vo';

export class AuthorizationReferenceMapper {
	public static mapToReferenceVo(
		authorizationContext: AuthorizationContext,
		referenceType: AuthorizableReferenceType,
		referenceId: EntityId,
		userId: EntityId,
		payload: AccessTokenPayload
	): TokenPayload {
		const context = new AuthorizationContextVO(authorizationContext);

		const referenceVo = new TokenPayload({
			authorizationContext: context,
			referenceType,
			referenceId,
			userId,
			customPayload: payload || {},
		});

		return referenceVo;
	}
}
