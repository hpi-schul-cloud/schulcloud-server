import { Injectable } from '@nestjs/common';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { AuthorizationContext } from '@src/modules/authorization/types/authorization-context.interface';
import { Rule } from '@src/modules/authorization/types/rule.interface';
import { AuthorizableObject } from '../domain-object';
import { BaseDO } from '../domainobject/base.do';
import { LegacySchoolDo } from '../domainobject/legacy-school.do';
import { User } from '../entity/user.entity';

/**
 * @deprecated because it uses the deprecated LegacySchoolDo.
 */
@Injectable()
export class LegacySchoolRule implements Rule {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, object: AuthorizableObject | BaseDO): boolean {
		const isMatched = object instanceof LegacySchoolDo;

		return isMatched;
	}

	public hasPermission(user: User, entity: LegacySchoolDo, context: AuthorizationContext): boolean {
		const hasPermission =
			this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions) && user.school.id === entity.id;

		return hasPermission;
	}
}
