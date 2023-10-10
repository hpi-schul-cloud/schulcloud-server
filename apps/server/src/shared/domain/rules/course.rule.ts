import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Course, User } from '@shared/domain/entity';
import { Action, AuthorizationContext, Rule, AuthorizationHelper } from '@src/modules/authorization';

@Injectable()
export class CourseRule implements Rule {
	constructor(
		@Inject(forwardRef(() => AuthorizationHelper)) private readonly authorizationHelper: AuthorizationHelper
	) {}

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
