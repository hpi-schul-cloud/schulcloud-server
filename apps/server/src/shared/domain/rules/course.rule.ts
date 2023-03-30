import { Injectable } from '@nestjs/common';
import type { User } from '../entity';
import { Course } from '../entity';
import { AuthorizationContext } from '../interface/permission';
import { Actions } from './actions.enum';
import { BasePermission } from './base-permission';

@Injectable()
export class CourseRule extends BasePermission<Course> {
	public isApplicable(user: User, entity: Course): boolean {
		const isMatched = entity instanceof Course;

		return isMatched;
	}

	public hasPermission(user: User, entity: Course, context: AuthorizationContext): boolean {
		const { action, requiredPermissions } = context;
		const hasPermission =
			this.utils.hasAllPermissions(user, requiredPermissions) &&
			this.utils.hasAccessToEntity(
				user,
				entity,
				action === Actions.read
					? ['teachers', 'substitutionTeachers', 'students']
					: ['teachers', 'substitutionTeachers']
			);

		return hasPermission;
	}
}
