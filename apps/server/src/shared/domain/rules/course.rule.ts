import { Injectable } from '@nestjs/common';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { Action } from '@src/modules/authorization/types/action.enum';
import { AuthorizationContext } from '@src/modules/authorization/types/authorization-context.interface';
import { Rule } from '@src/modules/authorization/types/rule.interface';
import { Course } from '../entity/course.entity';
import { User } from '../entity/user.entity';

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
