import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityId, User } from '@shared/domain';
import { AuthorizationHelper } from './authorization.helper';
import { AllowedAuthorizationEntityType } from './interfaces';
import { ReferenceLoader } from './reference.loader';
import { RuleManager } from './rule-manager';
import { AuthorizableObject, AuthorizationContext } from './types';

@Injectable()
export class AuthorizationService {
	constructor(
		private readonly ruleManager: RuleManager,
		private readonly loader: ReferenceLoader,
		private readonly authorizationHelper: AuthorizationHelper
	) {}

	public checkPermission(user: User, entity: AuthorizableObject, context: AuthorizationContext) {
		if (!this.ruleManager.hasPermission(user, entity, context)) {
			throw new ForbiddenException();
		}
	}

	public hasPermission(user: User, entity: AuthorizableObject, context: AuthorizationContext) {
		return this.ruleManager.hasPermission(user, entity, context);
	}

	public async checkPermissionByReferences(
		userId: EntityId,
		entityName: AllowedAuthorizationEntityType,
		entityId: EntityId,
		context: AuthorizationContext
	) {
		if (!(await this.hasPermissionByReferences(userId, entityName, entityId, context))) {
			throw new ForbiddenException();
		}
	}

	public async hasPermissionByReferences(
		userId: EntityId,
		entityName: AllowedAuthorizationEntityType,
		entityId: EntityId,
		context: AuthorizationContext
	): Promise<boolean> {
		try {
			const [user, entity] = await Promise.all([
				this.getUserWithPermissions(userId),
				this.loader.loadEntity(entityName, entityId),
			]);
			const permission = this.ruleManager.hasPermission(user, entity, context);

			return permission;
		} catch (err) {
			throw new ForbiddenException(err);
		}
	}

	public async getUserWithPermissions(userId: EntityId): Promise<User> {
		const userWithPermissions = await this.loader.getUserWithPermissions(userId);

		return userWithPermissions;
	}

	public hasAllPermissions(user: User, requiredPermissions: string[]): boolean {
		return this.authorizationHelper.hasAllPermissions(user, requiredPermissions);
	}

	public checkAllPermissions(user: User, requiredPermissions: string[]): void {
		return this.authorizationHelper.checkAllPermissions(user, requiredPermissions);
	}

	public hasOneOfPermissions(user: User, requiredPermissions: string[]): boolean {
		return this.authorizationHelper.hasOneOfPermissions(user, requiredPermissions);
	}

	public checkOneOfPermissions(user: User, requiredPermissions: string[]): void {
		return this.authorizationHelper.checkOneOfPermissions(user, requiredPermissions);
	}
}
