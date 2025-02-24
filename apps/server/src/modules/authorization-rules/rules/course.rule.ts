import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@modules/authorization';
import { Course } from '@modules/course';
import { CourseEntity } from '@modules/course/repo';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';

@Injectable()
export class CourseRule implements Rule<CourseEntity | Course> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof CourseEntity || object instanceof Course;

		return isMatched;
	}

	public hasPermission(user: User, object: CourseEntity | Course, context: AuthorizationContext): boolean {
		const { action, requiredPermissions } = context;

		const hasRequiredPermission = this.authorizationHelper.hasAllPermissions(user, requiredPermissions);
		const hasAdminPermission = this.authorizationHelper.hasAllPermissions(user, [Permission.COURSE_ADMINISTRATION]);

		const hasAccessToEntity = hasAdminPermission
			? true
			: this.authorizationHelper.hasAccessToEntity(
					user,
					object,
					this.isReadAction(action)
						? ['teachers', 'substitutionTeachers', 'students']
						: ['teachers', 'substitutionTeachers']
			  );

		return hasAccessToEntity && hasRequiredPermission;
	}

	isReadAction(action: Action) {
		if (action === Action.read) {
			return true;
		}
		return false;
	}
}
