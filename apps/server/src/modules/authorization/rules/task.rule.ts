import { Injectable } from '@nestjs/common';
import { Task, User } from '../../../shared/domain/entity';
import { AuthorizationHelper } from '../authorization.helper';
import { CourseRule } from './course.rule';
import { LessonRule } from './lesson.rule';
import { Action, AuthorizationContext, Rule } from '../types';

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
		const isAssigned = this.authorizationHelper.hasAccessToEntity(user, entity, ['users']);

		if (entity.isDraft()) {
			action = Action.write;
		}

		const hasParentPermission = this.hasParentPermission(user, entity, action);

		// TODO why parent permission is with OR cond?
		const result = hasRequiredPermission && (isCreator || isAssigned || hasParentPermission);

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
