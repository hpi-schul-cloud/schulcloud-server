import { AuthorizationContext, AuthorizationHelper, AuthorizationInjectionService, Rule } from '@modules/authorization';
import { Group } from '@modules/group';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GroupRule implements Rule<Group> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched: boolean = object instanceof Group;

		return isMatched;
	}

	public hasPermission(user: User, object: Group, context: AuthorizationContext): boolean {
		const hasPermission: boolean =
			this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions) &&
			(object.organizationId ? user.school.id === object.organizationId : true);

		return hasPermission;
	}
}
