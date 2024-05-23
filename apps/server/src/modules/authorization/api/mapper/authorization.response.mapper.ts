import { EntityId } from '@shared/domain/types';
import { AuthorizableReferenceType, AuthorizationContext } from '../../domain';
import { AuthorizedReponse } from '../dto/authorization.reponse';

export class AuthorizationReponseMapper {
	public static mapToSuccessResponse(
		userId: EntityId,
		authorizableReferenceType: AuthorizableReferenceType,
		authorizableReferenceId: EntityId,
		context: AuthorizationContext
	): AuthorizedReponse {
		const successAuthorizationReponse = AuthorizationReponseMapper.mapToResponse(
			userId,
			authorizableReferenceType,
			authorizableReferenceId,
			context,
			true
		);

		return successAuthorizationReponse;
	}

	private static mapToResponse(
		userId: EntityId,
		authorizableReferenceType: AuthorizableReferenceType,
		authorizableReferenceId: EntityId,
		context: AuthorizationContext,
		isAuthorized: boolean
	): AuthorizedReponse {
		const authorizationReponse = new AuthorizedReponse({
			userId,
			action: context.action,
			requiredPermissions: context.requiredPermissions,
			referenceType: authorizableReferenceType,
			refrenceId: authorizableReferenceId,
			isAuthorized,
		});

		return authorizationReponse;
	}
}
