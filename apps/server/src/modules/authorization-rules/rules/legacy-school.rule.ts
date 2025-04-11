import { AuthorizationContext, AuthorizationHelper, AuthorizationInjectionService, Rule } from '@modules/authorization';
import { LegacySchoolDo } from '@modules/legacy-school/domain';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';

/**
 * @deprecated because it uses the deprecated LegacySchoolDo.
 */
@Injectable()
export class LegacySchoolRule implements Rule<LegacySchoolDo> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof LegacySchoolDo;

		return isMatched;
	}

	public hasPermission(user: User, object: LegacySchoolDo, context: AuthorizationContext): boolean {
		const hasPermission =
			this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions) && user.school.id === object.id;

		return hasPermission;
	}
}
