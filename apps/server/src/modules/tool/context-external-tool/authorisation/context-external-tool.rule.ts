import { AuthorizationContext, AuthorizationHelper, AuthorizationInjectionService, Rule } from '@modules/authorization';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { ContextExternalTool } from '../domain';
import { ContextExternalToolEntity } from '../repo';

@Injectable()
export class ContextExternalToolRule implements Rule<ContextExternalToolEntity | ContextExternalTool> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched: boolean = object instanceof ContextExternalToolEntity || object instanceof ContextExternalTool;

		return isMatched;
	}

	public hasPermission(
		user: User,
		object: ContextExternalToolEntity | ContextExternalTool,
		context: AuthorizationContext
	): boolean {
		let hasPermission: boolean;
		const secondarySchools = user.secondarySchools ?? [];
		const secondarySchoolIds = secondarySchools.map(({ school }) => school.id);
		const schoolIds = [user.school.id, ...secondarySchoolIds];
		if (object instanceof ContextExternalToolEntity) {
			hasPermission =
				this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions) &&
				schoolIds.includes(object.schoolTool.school.id);
		} else {
			hasPermission =
				this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions) &&
				object.schoolToolRef.schoolId !== undefined &&
				schoolIds.includes(object.schoolToolRef.schoolId);
		}
		return hasPermission;
	}
}
