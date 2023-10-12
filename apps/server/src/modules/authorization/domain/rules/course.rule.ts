import { Injectable } from '@nestjs/common';
import { Course, User } from '@shared/domain/entity';
import { Action, AuthorizationContext, Rule } from '../type';
import { AuthorizationHelper } from '../service/authorization.helper';

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
