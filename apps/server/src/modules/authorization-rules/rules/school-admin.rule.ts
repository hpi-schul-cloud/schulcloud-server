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

@Injectable()
export class SchoolAdminRule implements Rule<School> {
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

		const canExecuteUserOperations = this.authorizationHelper.hasAllPermissions(user, [
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
		]);

		if (context.action === Action.read) {
			hasPermission = this.hasReadAccess(user, context);
		}
		if (context.action === Action.write) {
			hasPermission = this.hasWriteAccess(user, context);
		}

		return canExecuteUserOperations && hasPermission;
	}

	private hasReadAccess(user: User, context: AuthorizationContext): boolean {
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.SCHOOL_VIEW,
			...context.requiredPermissions,
		]);

		return hasPermission;
	}

	private hasWriteAccess(user: User, context: AuthorizationContext): boolean {
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.SCHOOL_EDIT,
			...context.requiredPermissions,
		]);

		return hasPermission;
	}
}
