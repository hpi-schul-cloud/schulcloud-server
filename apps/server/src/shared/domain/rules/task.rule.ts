import { Injectable } from '@nestjs/common';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { Action } from '@src/modules/authorization/types/action.enum';
import { AuthorizationContext } from '@src/modules/authorization/types/authorization-context.interface';
import { Rule } from '@src/modules/authorization/types/rule.interface';
import { Task } from '../entity/task.entity';
import { User } from '../entity/user.entity';
import { CourseRule } from './course.rule';
import { LessonRule } from './lesson.rule';

@Injectable()
export class TaskRule implements Rule {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		private readonly courseRule: CourseRule,
		private readonly lessonRule: LessonRule
	) {}

	public isApplicable(user: User, entity: Task): boolean {
		const isMatched = entity instanceof Task;

		return isMatched;
	}

	public hasPermission(user: User, entity: Task, context: AuthorizationContext): boolean {
		let { action } = context;
		const { requiredPermissions } = context;
		const hasRequiredPermission = this.authorizationHelper.hasAllPermissions(user, requiredPermissions);
		if (!hasRequiredPermission) {
			return false;
		}

		const isCreator = this.authorizationHelper.hasAccessToEntity(user, entity, ['creator']);
		if (entity.isDraft()) {
			action = Action.write;
		}

		const hasParentPermission = this.hasParentPermission(user, entity, action);

		// TODO why parent permission has OR cond?
		const result = isCreator || hasParentPermission;

		return result;
	}

	private hasParentPermission(user: User, entity: Task, action: Action): boolean {
		if (entity.lesson) {
			const hasLessonPermission = this.lessonRule.hasPermission(user, entity.lesson, {
				action,
				requiredPermissions: [],
			});
			return hasLessonPermission;
		}
		if (entity.course) {
			const hasCoursePermission = this.courseRule.hasPermission(user, entity.course, {
				action,
				requiredPermissions: [],
			});

			return hasCoursePermission;
		}
		return true;
	}
}
