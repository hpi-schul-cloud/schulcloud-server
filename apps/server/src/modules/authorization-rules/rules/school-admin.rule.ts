import { AuthorizationContext, AuthorizationHelper, AuthorizationInjectionService, Rule } from '@modules/authorization';
import { School } from '@modules/school';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface/permission.enum';

@Injectable()
export class SchoolAdminRule implements Rule<School> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isApplicable = object instanceof School && user.resolvePermissions().includes(Permission.SCHOOL_CREATE);

		return isApplicable;
	}

	public hasPermission(user: User, school: School, context: AuthorizationContext): boolean {
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);

		return hasPermission;
	}
}
