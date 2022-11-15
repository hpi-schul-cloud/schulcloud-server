import { Injectable } from '@nestjs/common';
import type { User } from '../entity';
import { Course } from '../entity';
import { IAuthorizationContext } from '../interface/rule';
import { Actions } from './actions.enum';
import { BaseRule } from './base-rule';

@Injectable()
export class CourseRule extends BaseRule<Course> {
	public isApplicable(user: User, entity: Course): boolean {
		const isMatched = entity instanceof Course;

		return isMatched;
	}

	public hasPermission(user: User, entity: Course, context: IAuthorizationContext): boolean {
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
