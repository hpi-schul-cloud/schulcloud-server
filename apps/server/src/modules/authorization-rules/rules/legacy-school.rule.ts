import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@modules/authorization';
import { LegacySchoolDo } from '@modules/legacy-school/domain';
import { User } from '@modules/user/repo';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';

/**
 * @deprecated because it uses the deprecated LegacySchoolDo.
 */
@Injectable()
export class LegacySchoolRule implements Rule<LegacySchoolDo> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof LegacySchoolDo;

		return isMatched;
	}

	public hasPermission(user: User, school: LegacySchoolDo, context: AuthorizationContext): boolean {
		let hasPermission = false;

		if (context.action === Action.read) {
			hasPermission = this.hasReadAccess(user, school, context);
		} else if (context.action === Action.write) {
			hasPermission = this.hasWriteAccess(user, school, context);
		} else {
			throw new NotImplementedException();
		}

		return hasPermission;
	}

	private hasReadAccess(user: User, object: LegacySchoolDo, context: AuthorizationContext): boolean {
		const isUserSchool = this.isUserSchool(user, object);
		// TODO: Permissions are missing here
		const hasReadPermission = this.authorizationHelper.hasAllPermissions(user, [...context.requiredPermissions]);
		const hasInstanceReadOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.SCHOOL_VIEW,
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			...context.requiredPermissions,
		]);

		return hasInstanceReadOperationPermission || (hasReadPermission && isUserSchool);
	}

	private hasWriteAccess(user: User, object: LegacySchoolDo, context: AuthorizationContext): boolean {
		return this.hasReadAccess(user, object, context);
	}

	private isUserSchool(user: User, object: LegacySchoolDo): boolean {
		const isUserSchool = user.school.id === object.id;

		return isUserSchool;
	}
}
