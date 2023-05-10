import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthorizableObject, EntityId, User } from '@shared/domain';
import { AuthorizationHelper } from './authorization.helper';
import { ForbiddenLoggableException } from './errors/forbidden.loggable-exception';
import { ReferenceLoader } from './reference.loader';
import { RuleManager } from './rule-manager';
import { AllowedAuthorizationEntityType, AuthorizationContext, LegacyAuthorizableObject } from './types';

@Injectable()
export class AuthorizationService {
	constructor(
		private readonly ruleManager: RuleManager,
		private readonly loader: ReferenceLoader,
		private readonly authorizationHelper: AuthorizationHelper
	) {}

	public checkPermission(
		user: User,
		object: AuthorizableObject | LegacyAuthorizableObject,
		context: AuthorizationContext
	): void {
		if (!this.hasPermission(user, object, context)) {
			throw new ForbiddenLoggableException(user.id, object.constructor.name, context);
		}
	}

	public hasPermission(
		user: User,
		object: AuthorizableObject | LegacyAuthorizableObject,
		context: AuthorizationContext
	): boolean {
		const rule = this.ruleManager.selectRule(user, object, context);
		const hasPermission = rule.hasPermission(user, object, context);

		return hasPermission;
	}

	public async checkPermissionByReferences(
		userId: EntityId,
		entityName: AllowedAuthorizationEntityType,
		entityId: EntityId,
		context: AuthorizationContext
	): Promise<void> {
		if (!(await this.hasPermissionByReferences(userId, entityName, entityId, context))) {
			throw new ForbiddenLoggableException(userId, entityName, context);
		}
	}

	public async hasPermissionByReferences(
		userId: EntityId,
		entityName: AllowedAuthorizationEntityType,
		entityId: EntityId,
		context: AuthorizationContext
	): Promise<boolean> {
		// TODO: This try-catch-block should be removed. See ticket: https://ticketsystem.dbildungscloud.de/browse/BC-4023
		try {
			const [user, entity] = await Promise.all([
				this.getUserWithPermissions(userId),
				this.loader.loadEntity(entityName, entityId),
			]);
			const rule = this.ruleManager.selectRule(user, entity, context);
			const hasPermission = rule.hasPermission(user, entity, context);

			return hasPermission;
		} catch (err) {
			throw new ForbiddenException(err);
		}
	}

	public checkAllPermissions(user: User, requiredPermissions: string[]): void {
		if (!this.authorizationHelper.hasAllPermissions(user, requiredPermissions)) {
			// TODO: Should be ForbiddenException
			throw new UnauthorizedException();
		}
	}

	public hasAllPermissions(user: User, requiredPermissions: string[]): boolean {
		return this.authorizationHelper.hasAllPermissions(user, requiredPermissions);
	}

	public checkOneOfPermissions(user: User, requiredPermissions: string[]): void {
		if (!this.authorizationHelper.hasOneOfPermissions(user, requiredPermissions)) {
			// TODO: Should be ForbiddenException
			throw new UnauthorizedException();
		}
	}

	public hasOneOfPermissions(user: User, requiredPermissions: string[]): boolean {
		return this.authorizationHelper.hasOneOfPermissions(user, requiredPermissions);
	}

	public async getUserWithPermissions(userId: EntityId): Promise<User> {
		const userWithPermissions = await this.loader.getUserWithPermissions(userId);

		return userWithPermissions;
	}
}
