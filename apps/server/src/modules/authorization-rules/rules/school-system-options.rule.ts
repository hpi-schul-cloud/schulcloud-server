import { AuthorizationContext, AuthorizationHelper, AuthorizationInjectionService, Rule } from '@modules/authorization';
import { SchoolSystemOptions } from '@modules/legacy-school';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SchoolSystemOptionsRule implements Rule<SchoolSystemOptions> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched: boolean = object instanceof SchoolSystemOptions;

		return isMatched;
	}

	public hasPermission(user: User, object: SchoolSystemOptions, context: AuthorizationContext): boolean {
		const hasPermissions: boolean = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);

		const isAtSchool: boolean = user.school.id === object.schoolId;

		const hasSystem: boolean = user.school.systems.getIdentifiers().includes(object.systemId);

		const isAuthorized: boolean = hasPermissions && isAtSchool && hasSystem;

		return isAuthorized;
	}
}
