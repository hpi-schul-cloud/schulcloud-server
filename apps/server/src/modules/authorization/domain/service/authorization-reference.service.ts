import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ForbiddenLoggableException } from '../error';
import { AuthorizableReferenceType, AuthorizationContext } from '../type';
import { AuthorizationService } from './authorization.service';
import { ReferenceLoader } from './reference.loader';

/**
 * Should by use only internal in authorization module. See ticket: BC-3990
 */
@Injectable()
export class AuthorizationReferenceService {
	constructor(private readonly loader: ReferenceLoader, private readonly authorizationService: AuthorizationService) {}

	public async checkPermissionByReferences(
		userId: EntityId,
		entityName: AuthorizableReferenceType,
		entityId: EntityId,
		context: AuthorizationContext
	): Promise<void> {
		if (!(await this.hasPermissionByReferences(userId, entityName, entityId, context))) {
			throw new ForbiddenLoggableException(userId, entityName, context);
		}
	}

	public async hasPermissionByReferences(
		userId: EntityId,
		entityName: AuthorizableReferenceType,
		entityId: EntityId,
		context: AuthorizationContext
	): Promise<boolean> {
		const [user, object] = await Promise.all([
			this.authorizationService.getUserWithPermissions(userId),
			this.loader.loadAuthorizableObject(entityName, entityId),
		]);

		const hasPermission = this.authorizationService.hasPermission(user, object, context);

		return hasPermission;
	}
}
