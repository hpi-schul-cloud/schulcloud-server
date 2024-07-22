import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
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
		const hasRequiredPermissions = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);

		const isUsersSchool = user.school.id === school.id;

		const hasPermission = hasRequiredPermissions && isUsersSchool;

		return hasPermission;
	}
}
