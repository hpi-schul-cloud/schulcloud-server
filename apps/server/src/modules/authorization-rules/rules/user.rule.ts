import { AuthorizationContext, AuthorizationHelper, AuthorizationInjectionService, Rule } from '@modules/authorization';
import { UserDo } from '@modules/user';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserRule implements Rule<UserDo> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof UserDo;

		return isMatched;
	}

	public hasPermission(user: User, entity: UserDo, context: AuthorizationContext): boolean {
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);

		const isOwner = user.id === entity.id;
		const isUsersSchool = user.school.id === entity.schoolId;
		const isDiscoverable = entity.discoverable || false;

		const isVisible = isOwner || isUsersSchool || isDiscoverable;

		return hasPermission && isVisible;
	}
}
