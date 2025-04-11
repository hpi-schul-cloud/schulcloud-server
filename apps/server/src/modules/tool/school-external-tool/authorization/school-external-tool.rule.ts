import { AuthorizationContext, AuthorizationHelper, AuthorizationInjectionService, Rule } from '@modules/authorization';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { SchoolExternalTool } from '../domain';
import { SchoolExternalToolEntity } from '../repo';

@Injectable()
export class SchoolExternalToolRule implements Rule<SchoolExternalToolEntity | SchoolExternalTool> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched: boolean = object instanceof SchoolExternalToolEntity || object instanceof SchoolExternalTool;

		return isMatched;
	}

	public hasPermission(
		user: User,
		object: SchoolExternalToolEntity | SchoolExternalTool,
		context: AuthorizationContext
	): boolean {
		let hasPermission: boolean;
		if (object instanceof SchoolExternalToolEntity) {
			hasPermission =
				this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions) &&
				user.school.id === object.school.id;
		} else {
			hasPermission =
				this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions) &&
				user.school.id === object.schoolId;
		}
		return hasPermission;
	}
}
