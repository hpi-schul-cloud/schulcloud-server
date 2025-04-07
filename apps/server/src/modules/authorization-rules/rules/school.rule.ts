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

		return hasPermission && isUserSchool;
	}

	private hasWriteAccess(user: User, object: School, context: AuthorizationContext): boolean {
		const isUserSchool = this.isUserSchool(user, object);
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.SCHOOL_EDIT,
			...context.requiredPermissions,
		]);

		return hasPermission && isUserSchool;
	}

	private isUserSchool(user: User, object: School): boolean {
		// better currentUser.isMemberOfSchool(object);
		const isUserSchool = user.school.id === object.id;

		return isUserSchool;
	}
}
