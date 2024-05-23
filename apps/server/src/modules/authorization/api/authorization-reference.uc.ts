import { EntityId } from '@shared/domain/types';
import { AuthorizableReferenceType, AuthorizationContext, AuthorizationReferenceService } from '../domain';
import { AuthorizedReponse } from './dto';
import { AuthorizationReponseMapper } from './mapper';

export class AuthorizationReferenceUc {
	constructor(private readonly authorizationReferenceService: AuthorizationReferenceService) {}

	public async authorizeByReference(
		userId: EntityId,
		authorizableReferenceType: AuthorizableReferenceType,
		authorizableReferenceId: EntityId,
		context: AuthorizationContext
	): Promise<AuthorizedReponse> {
		await this.authorizationReferenceService.checkPermissionByReferences(
			userId,
			authorizableReferenceType,
			authorizableReferenceId,
			context
		);

		const successAuthorizationReponse = AuthorizationReponseMapper.mapToSuccessResponse(
			userId,
			authorizableReferenceType,
			authorizableReferenceId,
			context
		);

		return successAuthorizationReponse;
	}
}
