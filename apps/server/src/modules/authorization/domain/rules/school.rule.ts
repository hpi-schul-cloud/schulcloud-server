import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface/permission.enum';
import { School } from '@src/modules/school/domain/do';
import { AuthorizationHelper } from '../service/authorization.helper';
import { AuthorizationContext, Rule } from '../type';

@Injectable()
export class SchoolRule implements Rule<School> {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

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
