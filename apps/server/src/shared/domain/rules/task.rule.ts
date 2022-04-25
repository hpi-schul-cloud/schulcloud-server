import { Injectable } from '@nestjs/common';
import type { Task, User } from '@shared/domain';
import { Actions } from './actions.enum';
import { BaseRule } from './base.rule';
import { CourseRule } from './course.rule';

@Injectable()
export class TaskRule extends BaseRule {
	constructor(private readonly courseRule: CourseRule) {
		super();
	}

	hasPermission(user: User, task: Task, action: Actions): boolean {
		const isCreator = this.hasAccessToEntity(user, task, ['creator']);
		let hasCoursePermission = false;

		if (task.course) {
			hasCoursePermission = this.courseRule.hasPermission(user, task.course, action);
		}
		const hasPermission = isCreator || hasCoursePermission;

		return hasPermission;
	}
}
