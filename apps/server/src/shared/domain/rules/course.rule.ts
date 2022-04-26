import { Injectable } from '@nestjs/common';
import type { Course, User } from '@shared/domain';
import { Actions } from './actions.enum';
import { BaseRule } from './base.rule';

@Injectable()
export class CourseRule extends BaseRule {
	hasPermission(user: User, course: Course, action: Actions): boolean {
		const hasPermission = this.hasAccessToEntity(
			user,
			course,
			action === Actions.read ? ['teachers', 'substitutionTeachers', 'students'] : ['teachers', 'substitutionTeachers']
		);

		return hasPermission;
	}
}
