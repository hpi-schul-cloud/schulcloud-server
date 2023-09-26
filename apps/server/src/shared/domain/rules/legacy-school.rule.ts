import { Injectable } from '@nestjs/common';
import { BaseDO, LegacySchoolDo } from '@shared/domain';
import { User } from '@shared/domain/entity';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { AuthorizationContext, Rule } from '@src/modules/authorization/types';
import { AuthorizableObject } from '../domain-object';

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
