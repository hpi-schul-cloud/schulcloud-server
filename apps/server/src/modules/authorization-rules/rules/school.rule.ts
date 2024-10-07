import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import {
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@src/modules/authorization';
import { Permission } from '@shared/domain/interface/permission.enum';
import { School } from '@src/modules/school/domain/do';

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

	public hasPermission(user: User, school: School, context: AuthorizationContext): boolean {
		let hasPermission = false;
		const isUsersSchool = user.school.id === school.id;
		if (isUsersSchool) {
			hasPermission = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);
		} else {
			hasPermission = this.authorizationHelper.hasAllPermissions(user, [Permission.SCHOOL_EDIT_ALL]);
		}

		return hasPermission;
	}
}
