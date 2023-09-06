import { Injectable, UnauthorizedException } from '@nestjs/common';
import { BaseDO, User } from '@shared/domain';
import { AuthorizableObject } from '@shared/domain/domain-object';
import { AuthorizationHelper } from './authorization.helper';
import { ForbiddenLoggableException } from './errors/forbidden.loggable-exception';
import { RuleManager } from './rule-manager';
import { AuthorizationContext } from './types';

@Injectable()
export class AuthorizationService {
	constructor(private readonly ruleManager: RuleManager, private readonly authorizationHelper: AuthorizationHelper) {}

	public checkPermission(user: User, object: AuthorizableObject | BaseDO, context: AuthorizationContext): void {
		if (!this.hasPermission(user, object, context)) {
			throw new ForbiddenLoggableException(user.id, object.constructor.name, context);
		}
	}

	public hasPermission(user: User, object: AuthorizableObject | BaseDO, context: AuthorizationContext): boolean {
		const rule = this.ruleManager.selectRule(user, object, context);
		const hasPermission = rule.hasPermission(user, object, context);

		return hasPermission;
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
	/* think about it
	public async getUserWithPermissions(userId: EntityId): Promise<User> {
		const userWithPermissions = await this.loader.getUserWithPermissions(userId);

		return userWithPermissions;
	}
*/
}
