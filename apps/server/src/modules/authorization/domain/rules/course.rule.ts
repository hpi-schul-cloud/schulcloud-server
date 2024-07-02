import { Course } from '@modules/learnroom/domain';
import { Injectable } from '@nestjs/common';
import { Course as CourseEntity, User } from '@shared/domain/entity';
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
		const hasPermission =
			this.authorizationHelper.hasAllPermissions(user, requiredPermissions) &&
			this.authorizationHelper.hasAccessToEntity(
				user,
				object,
				action === Action.read ? ['teachers', 'substitutionTeachers', 'students'] : ['teachers', 'substitutionTeachers']
			);

		return hasPermission;
	}
}
