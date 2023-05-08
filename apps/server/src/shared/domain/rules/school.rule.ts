import { Injectable } from '@nestjs/common';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { School, User } from '@shared/domain/entity';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { AuthorizationContext, Rule } from '@src/modules/authorization/types';

@Injectable()
export class SchoolRule implements Rule {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, entity: School | SchoolDO): boolean {
		const isMatched: boolean = entity instanceof School || entity instanceof SchoolDO;

		return isMatched;
	}

	public hasPermission(user: User, entity: School | SchoolDO, context: AuthorizationContext): boolean {
		const hasPermission: boolean =
			this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions) && user.school.id === entity.id;

		return hasPermission;
	}
}
