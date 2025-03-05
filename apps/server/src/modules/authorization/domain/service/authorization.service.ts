import { User } from '@modules/user/repo';
// Needs deep import because of cyclic dependency  - will be solved in BC-9169
import { UserService } from '@modules/user/service/user.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthorizableObject } from '@shared/domain/domain-object';
import { BaseDO } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { ForbiddenLoggableException } from '../error';
import { AuthorizationContext } from '../type';
import { AuthorizationHelper } from './authorization.helper';
import { RuleManager } from './rule-manager';

@Injectable()
export class AuthorizationService {
	constructor(
		private readonly ruleManager: RuleManager,
		private readonly authorizationHelper: AuthorizationHelper,
		private readonly userService: UserService
	) {}

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
			// TODO: Should be ForbiddenLoggableException
			throw new UnauthorizedException();
		}
	}

	public hasAllPermissions(user: User, requiredPermissions: string[]): boolean {
		return this.authorizationHelper.hasAllPermissions(user, requiredPermissions);
	}

	public checkOneOfPermissions(user: User, requiredPermissions: string[]): void {
		if (!this.authorizationHelper.hasOneOfPermissions(user, requiredPermissions)) {
			// TODO: Should be ForbiddenLoggableException
			throw new UnauthorizedException();
		}
	}

	public hasOneOfPermissions(user: User, requiredPermissions: string[]): boolean {
		return this.authorizationHelper.hasOneOfPermissions(user, requiredPermissions);
	}

	public async getUserWithPermissions(userId: EntityId): Promise<User> {
		// replace with service method getUserWithPermissions BC-5069
		const userWithPopulatedRoles = await this.userService.getUserEntityWithRoles(userId);

		return userWithPopulatedRoles;
	}
}
