import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@modules/authorization';
import { School } from '@modules/school';
import type { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface/permission.enum';

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

	public hasPermission(user: User, school: School, context: AuthorizationContext): boolean {
		let hasPermission = false;

		if (context.action === Action.read) {
			hasPermission = this.hasReadAccess(user, school, context);
		}
		if (context.action === Action.write) {
			hasPermission = this.hasWriteAccess(user, school, context);
		}

		return hasPermission;
	}

	private hasReadAccess(user: User, object: School, context: AuthorizationContext): boolean {
		const isUserSchool = this.isUserSchool(user, object);
		const hasReadPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.SCHOOL_VIEW,
			...context.requiredPermissions,
		]);

		const hasInstanceReadOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.SCHOOL_VIEW,
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			...context.requiredPermissions,
		]);

		return hasInstanceReadOperationPermission || (hasReadPermission && isUserSchool);
	}

	private hasWriteAccess(user: User, object: School, context: AuthorizationContext): boolean {
		const isUserSchool = this.isUserSchool(user, object);
		const hasWritePermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.SCHOOL_EDIT,
			...context.requiredPermissions,
		]);

		const hasInstanceWriteOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.SCHOOL_EDIT,
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			...context.requiredPermissions,
		]);

		return hasInstanceWriteOperationPermission || (hasWritePermission && isUserSchool);
	}

	private isUserSchool(user: User, object: School): boolean {
		const isUserSchool = user.school.id === object.id;

		return isUserSchool;
	}
}
