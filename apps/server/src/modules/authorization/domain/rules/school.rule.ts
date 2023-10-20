import { Injectable } from '@nestjs/common';
import { AuthorizableObject } from '@shared/domain/domain-object';
import { BaseDO } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import { AuthorizationContext, Rule } from '@src/modules';
import { School } from '@src/modules/school/domain';
import { AuthorizationHelper } from '../service/authorization.helper';

@Injectable()
export class SchoolRule implements Rule {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, object: AuthorizableObject | BaseDO): boolean {
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
