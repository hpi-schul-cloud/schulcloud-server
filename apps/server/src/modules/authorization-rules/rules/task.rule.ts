import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@modules/authorization';
import { Task } from '@modules/task/repo';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { CourseRule } from './course.rule';
import { LessonRule } from './lesson.rule';

@Injectable()
export class TaskRule implements Rule<Task> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		private readonly courseRule: CourseRule,
		private readonly lessonRule: LessonRule,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof Task;

		return isMatched;
	}

	public hasPermission(user: User, object: Task, context: AuthorizationContext): boolean {
		let { action } = context;
		const { requiredPermissions } = context;
		const hasRequiredPermission = this.authorizationHelper.hasAllPermissions(user, requiredPermissions);
		if (!hasRequiredPermission) {
			return false;
		}

		const isCreator = this.authorizationHelper.hasAccessToEntity(user, object, ['creator']);
		if (object.isDraft()) {
			action = Action.write;
		}

		const hasParentPermission = this.hasParentPermission(user, object, action);

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
		return false;
	}
}
