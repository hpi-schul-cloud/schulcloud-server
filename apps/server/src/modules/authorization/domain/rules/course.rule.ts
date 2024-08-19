import { Course } from '@modules/learnroom/domain';
import { Injectable } from '@nestjs/common';
import { Course as CourseEntity, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { AuthorizationHelper } from '../service/authorization.helper';
import { Action, AuthorizationContext, Rule } from '../type';

@Injectable()
export class CourseRule implements Rule<CourseEntity | Course> {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

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
					action === Action.read
						? ['teachers', 'substitutionTeachers', 'students']
						: ['teachers', 'substitutionTeachers']
			  );

		return hasAccessToEntity && hasRequiredPermission;
	}
}
