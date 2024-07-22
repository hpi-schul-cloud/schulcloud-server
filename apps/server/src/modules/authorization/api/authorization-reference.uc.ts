import { EntityId } from '@shared/domain/types';
import { Injectable } from '@nestjs/common';
import { AuthorizableReferenceType, AuthorizationContext, AuthorizationReferenceService } from '../domain';
import { AuthorizedReponse } from './dto';
import { AuthorizationReponseMapper } from './mapper';

@Injectable()
export class AuthorizationReferenceUc {
	constructor(private readonly authorizationReferenceService: AuthorizationReferenceService) {}

	public async authorizeByReference(
		userId: EntityId,
		authorizableReferenceType: AuthorizableReferenceType,
		authorizableReferenceId: EntityId,
		context: AuthorizationContext
	): Promise<AuthorizedReponse> {
		const hasPermission = await this.authorizationReferenceService.hasPermissionByReferences(
			userId,
			authorizableReferenceType,
			authorizableReferenceId,
			context
		);

		const authorizationReponse = AuthorizationReponseMapper.mapToResponse(userId, hasPermission);

		return authorizationReponse;
	}
}
