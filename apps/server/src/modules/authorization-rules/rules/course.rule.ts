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
import { Injectable, NotImplementedException } from '@nestjs/common';
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
		let hasPermission = false;
	
		if (context.action === Action.read) {
			hasPermission = this.hasReadAccess(user, object, context);
		} else if (context.action === Action.write) {
			hasPermission = this.hasWriteAccess(user, object, context);
		} else {
			throw new NotImplementedException();
		}
	
		return hasPermission;
	}

	private hasReadAccess(user: User, object: CourseEntity | Course, context: AuthorizationContext): boolean {
		const isUserCourse = this.authorizationHelper.hasAccessToEntity(user, object, ['teachers', 'substitutionTeachers', 'students']);
		// TODO Read permission is missing
		const hasReadPermission = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);

		const hasInstanceReadOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.COURSE_VIEW,
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			...context.requiredPermissions,
		]);

		return hasInstanceReadOperationPermission || (hasReadPermission && isUserCourse);
	}

	private hasWriteAccess(user: User, object: CourseEntity | Course, context: AuthorizationContext): boolean {
		const isTeacherInCourse = this.authorizationHelper.hasAccessToEntity(user, object, ['teachers', 'substitutionTeachers']);
		// TODO Why COURSE_ADMINISTRATION
		const hasWritePermission = this.authorizationHelper.hasAllPermissions(user, [Permission.COURSE_ADMINISTRATION, ...context.requiredPermissions]);

		const hasInstanceWriteOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.COURSE_EDIT,
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			...context.requiredPermissions,
		]);

		return hasInstanceWriteOperationPermission || (hasWritePermission && isTeacherInCourse);
	};
}
