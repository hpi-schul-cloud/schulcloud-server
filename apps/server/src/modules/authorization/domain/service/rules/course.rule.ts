import { Injectable } from '@nestjs/common';
import { Course, User } from '@shared/domain/entity';
import { Action, AuthorizationContext, Rule } from '../../../types';
import { AuthorizationHelper } from '../authorization.helper';

@Injectable()
export class CourseRule implements Rule {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, entity: Course): boolean {
		const isMatched = entity instanceof Course;

		return isMatched;
	}

	public hasPermission(user: User, entity: Course, context: AuthorizationContext): boolean {
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
