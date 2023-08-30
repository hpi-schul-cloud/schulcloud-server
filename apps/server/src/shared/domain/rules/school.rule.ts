import { Injectable } from '@nestjs/common';
import { LegacySchoolDo } from '@shared/domain';
import { School, User } from '@shared/domain/entity';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { AuthorizationContext, Rule } from '@src/modules/authorization/types';

@Injectable()
export class SchoolRule implements Rule {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, entity: School | LegacySchoolDo): boolean {
		const isMatched: boolean = entity instanceof School || entity instanceof LegacySchoolDo;

		return isMatched;
	}

	public hasPermission(user: User, entity: School | LegacySchoolDo, context: AuthorizationContext): boolean {
		const hasPermission: boolean =
			this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions) && user.school.id === entity.id;

		return hasPermission;
	}
}
