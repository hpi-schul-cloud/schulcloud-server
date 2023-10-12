import { Injectable } from '@nestjs/common';
import { BaseDO, LegacySchoolDo } from '@shared/domain';
import { User } from '@shared/domain/entity';
import { AuthorizableObject } from '@shared/domain/domain-object';
import { AuthorizationContext, Rule } from '../type';
import { AuthorizationHelper } from '../service/authorization.helper';

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
