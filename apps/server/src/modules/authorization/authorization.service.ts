import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityId, User } from '@shared/domain';
import { AuthorizationHelper } from './authorization.helper';
import { ReferenceLoader } from './reference.loader';
import { RuleManager } from './rule-manager';
import { AllowedAuthorizationEntityType, AuthorizableObject, AuthorizationContext } from './types';

@Injectable()
export class AuthorizationService {
	constructor(
		private readonly ruleManager: RuleManager,
		private readonly loader: ReferenceLoader,
		private readonly authorizationHelper: AuthorizationHelper
	) {}

	public checkIfAuthorized(user: User, entity: AuthorizableObject, context: AuthorizationContext): void {
		if (!this.ruleManager.isAuthorized(user, entity, context)) {
			throw new ForbiddenException();
		}
	}

	public isAuthorized(user: User, entity: AuthorizableObject, context: AuthorizationContext): boolean {
		return this.ruleManager.isAuthorized(user, entity, context);
	}

	public async checkIfAuthorizedByReferences(
		userId: EntityId,
		entityName: AllowedAuthorizationEntityType,
		entityId: EntityId,
		context: AuthorizationContext
	): Promise<void> {
		if (!(await this.isAuthorizedByReferences(userId, entityName, entityId, context))) {
			throw new ForbiddenException();
		}
	}

	public async isAuthorizedByReferences(
		userId: EntityId,
		entityName: AllowedAuthorizationEntityType,
		entityId: EntityId,
		context: AuthorizationContext
	): Promise<boolean> {
		// TODO: I think this try-catch is unnecessary and wrong because there can be different reasons why the entity cannot be loaded and they should bubble up.
		try {
			const [user, entity] = await Promise.all([
				this.getUserWithPermissions(userId),
				this.loader.loadEntity(entityName, entityId),
			]);
			const isAuthorized = this.ruleManager.isAuthorized(user, entity, context);

			return isAuthorized;
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

	public resolvePermissions(user: User): string[] {
		return this.authorizationHelper.resolvePermissions(user);
	}
}
