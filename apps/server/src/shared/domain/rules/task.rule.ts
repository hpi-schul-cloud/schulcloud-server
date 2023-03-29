import { Injectable } from '@nestjs/common';
import { Task, User } from '../entity';
import { IPermissionContext } from '../interface/permission';
import { Actions } from './actions.enum';
import { BasePermission } from './base-permission';
import { CourseRule } from './course.rule';
import { LessonRule } from './lesson.rule';

@Injectable()
export class TaskRule extends BasePermission<Task> {
	constructor(private readonly courseRule: CourseRule, private readonly lessonRule: LessonRule) {
		super();
	}

	public isApplicable(user: User, entity: Task): boolean {
		const isMatched = entity instanceof Task;

		return isMatched;
	}

	public hasPermission(user: User, entity: Task, context: IPermissionContext): boolean {
		let { action } = context;
		const { requiredPermissions } = context;
		const hasRequiredPermission = this.utils.hasAllPermissions(user, requiredPermissions);
		if (!hasRequiredPermission) {
			return false;
		}

		const isCreator = this.utils.hasAccessToEntity(user, entity, ['creator']);
		const isAssigned = this.utils.hasAccessToEntity(user, entity, ['users']);

		if (entity.isDraft()) {
			action = Actions.write;
		}

		const hasParentPermission = this.hasParentPermission(user, entity, action);

		// TODO why parent permission is with OR cond?
		const result = hasRequiredPermission && (isCreator || isAssigned || hasParentPermission);

		return result;
	}

	private hasParentPermission(user: User, entity: Task, action: Actions): boolean {
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
