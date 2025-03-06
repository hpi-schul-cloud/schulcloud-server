import { type User } from '@modules/user/repo';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthorizableObject } from '@shared/domain/domain-object';
import { BaseDO } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { ForbiddenLoggableException } from '../error';
import { AuthorizationContext } from '../type';
import { AuthorizationInjectionService } from './authorization-injection.service';
import { AuthorizationHelper } from './authorization.helper';
import { RuleManager } from './rule-manager';

@Injectable()
export class AuthorizationService {
	constructor(
		private readonly ruleManager: RuleManager,
		private readonly authorizationHelper: AuthorizationHelper,
		private readonly authorizationInjectionService: AuthorizationInjectionService
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
		const userLoader = this.authorizationInjectionService.getCurrentUserLoader();
		const userWithPopulatedRoles = await userLoader.loadCurrentUserWithPermissions(userId);

		return userWithPopulatedRoles;
	}
}
