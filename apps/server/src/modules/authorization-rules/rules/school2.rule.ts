/* eslint-disable filename-rules/match */
import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@modules/authorization';
import { School } from '@modules/school';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';

// TODO: Wenn die Berechtigungen in der gleichen Rule sind, anstatt eine zweite einzufügen

/**
 * Check this rule in BC-9295
 */
@Injectable()
export class SchoolRule implements Rule<School> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isApplicable = object instanceof School;

		return isApplicable;
	}

	public hasPermission(user: User, object: School, context: AuthorizationContext): boolean {
		let hasPermission = false;

		if (context.action === Action.read) {
			hasPermission = this.hasReadAccess(user, object, context);
		}
		if (context.action === Action.write) {
			hasPermission = this.hasWriteAccess(user, object, context);
		}

		return hasPermission;
	}

	private hasReadAccess(user: User, object: School, context: AuthorizationContext): boolean {
		const isUserSchool = this.isUserSchool(user, object);
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.SCHOOL_VIEW,
			...context.requiredPermissions,
		]);

		const hasInstanceOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.SCHOOL_VIEW,
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			...context.requiredPermissions,
		]);

		return hasInstanceOperationPermission || (hasPermission && isUserSchool);
	}

	private hasWriteAccess(user: User, object: School, context: AuthorizationContext): boolean {
		const isUserSchool = this.isUserSchool(user, object);
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.SCHOOL_EDIT,
			...context.requiredPermissions,
		]);

		const hasInstanceOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.SCHOOL_EDIT,
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			...context.requiredPermissions,
		]);

		return hasInstanceOperationPermission || (hasPermission && isUserSchool);
	}

	private isUserSchool(user: User, object: School): boolean {
		const isUserSchool = user.school.id === object.id;

		return isUserSchool;
	}
}
