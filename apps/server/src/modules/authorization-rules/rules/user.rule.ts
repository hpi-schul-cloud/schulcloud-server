import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@modules/authorization';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';

/**
 * Check this rule in BC-9292
 */
@Injectable()
export class UserRule implements Rule<User> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof User;

		return isMatched;
	}

	public hasPermission(user: User, object: User, context: AuthorizationContext): boolean {
		let hasPermission = false;

		if (context.action === Action.read) {
			hasPermission = this.hasReadAccess(user, object, context);
		}
		if (context.action === Action.write) {
			hasPermission = this.hasWriteAccess(user, object, context);
		}

		return hasPermission;
	}

	private hasReadAccess(user: User, object: User, context: AuthorizationContext): boolean {
		const isOwner = user.id === object.id;
		const isSameSchool = user.getSchoolId() === object.getSchoolId();
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.USER_VIEW,
			...context.requiredPermissions,
		]);

		return (hasPermission && isSameSchool) || isOwner;
	}

	private hasWriteAccess(user: User, object: User, context: AuthorizationContext): boolean {
		const isOwner = user.id === object.id;
		const isSameSchool = user.getSchoolId() === object.getSchoolId();
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.USER_EDIT,
			...context.requiredPermissions,
		]);

		return (hasPermission && isSameSchool) || isOwner;
	}
}
