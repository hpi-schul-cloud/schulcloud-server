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

	public hasPermission(user: User, entity: School, context: AuthorizationContext): boolean {
		let hasPermission = false;
		const isUsersSchool = user.school.id === entity.id;

		if (context.action === Action.read) {
			hasPermission = this.hasReadAccess(user, context);
		}
		if (context.action === Action.write) {
			hasPermission = this.hasWriteAccess(user, context);
		}
		return hasPermission && isUsersSchool;
	}

	private hasReadAccess(user: User, context: AuthorizationContext): boolean {
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);

		return hasPermission;
	}

	private hasWriteAccess(user: User, context: AuthorizationContext): boolean {
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);

		return hasPermission;
	}
}
