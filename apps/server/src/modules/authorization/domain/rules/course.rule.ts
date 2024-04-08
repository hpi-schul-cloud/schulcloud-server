import { Course } from '@modules/learnroom/domain';
import { Injectable } from '@nestjs/common';
import { Course as CourseEntity, User } from '@shared/domain/entity';
import { AuthorizationHelper } from '../service/authorization.helper';
import { Action, AuthorizationContext, Rule } from '../type';

@Injectable()
export class CourseRule implements Rule {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, entity: unknown): boolean {
		const isMatched = entity instanceof CourseEntity || entity instanceof Course;

		return isMatched;
	}

	public hasPermission(user: User, entity: CourseEntity | Course, context: AuthorizationContext): boolean {
		const { action, requiredPermissions } = context;
		const hasPermission =
			this.authorizationHelper.hasAllPermissions(user, requiredPermissions) &&
			this.authorizationHelper.hasAccessToEntity(
				user,
				entity,
				action === Action.read ? ['teachers', 'substitutionTeachers', 'students'] : ['teachers', 'substitutionTeachers']
			);

		return hasPermission;
	}
}
