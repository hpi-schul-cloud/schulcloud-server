import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ReferenceLoader } from './reference.loader';
import { AuthorizationContext } from '../../types';
import { AuthorizableReferenceType } from './types';
import { ForbiddenLoggableException } from '../../errors';
import { AuthorizationService } from '../../authorization.service';

/**
 * Should by use only internal in authorization module.
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
		try {
			const [user, object] = await Promise.all([
				this.authorizationService.getUserWithPermissions(userId),
				this.loader.loadAuthorizableObject(entityName, entityId),
			]);

			const hasPermission = this.authorizationService.hasPermission(user, object, context);

			return hasPermission;
		} catch (error) {
			throw new ForbiddenLoggableException(userId, entityName, context); // TODO: cause
		}
	}
}
