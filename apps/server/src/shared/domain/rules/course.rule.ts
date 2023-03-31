import { Injectable } from '@nestjs/common';
import type { User } from '../entity';
import { Course } from '../entity';
import { AuthorizationContext } from '../interface/permission';
import { Actions } from './actions.enum';
import { AuthorizationHelper } from './authorization.helper';

@Injectable()
export class CourseRule {
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
				action === Actions.read
					? ['teachers', 'substitutionTeachers', 'students']
					: ['teachers', 'substitutionTeachers']
			);

		return hasPermission;
	}
}
