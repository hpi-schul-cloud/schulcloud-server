import {
	AuthorizableReferenceType,
	AuthorizationContext,
	AuthorizationService,
	ForbiddenLoggableException,
} from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
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
		if (!(await this.hasPermissionByReference(userId, entityName, entityId, context))) {
			throw new ForbiddenLoggableException(userId, entityName, context);
		}
	}

	public async hasPermissionByReference(
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

	public async hasPermissionByReferences(
		userId: EntityId,
		entityName: AuthorizableReferenceType[],
		entityId: EntityId[],
		context: AuthorizationContext
	): Promise<boolean> {
		const results = await Promise.all(
			entityName.map((name, idx) => this.hasPermissionByReference(userId, name, entityId[idx], context))
		);

		return results.every(Boolean);
	}
}
