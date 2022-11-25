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
		const { action, requiredPermissions } = context;
		const hasPermission = this.utils.hasAllPermissions(user, requiredPermissions);
		const isCreator = this.utils.hasAccessToEntity(user, entity, ['creator']);

		let hasTaskPermission = false;

		if (action === Actions.read) {
			hasTaskPermission = this.taskReadPermission(user, entity);
		} else if (action === Actions.write) {
			hasTaskPermission = this.taskWritePermission(user, entity);
		}

		const result = hasPermission && (isCreator || hasTaskPermission);

		return result;
	}

	private taskReadPermission(user: User, entity: Task): boolean {
		const isDraft = entity.isDraft();
		let hasParentReadPermission = false;

		if (isDraft) {
			hasParentReadPermission = this.parentPermission(user, entity, Actions.write);
		} else {
			hasParentReadPermission = this.parentPermission(user, entity, Actions.read);
		}

		const result = hasParentReadPermission;

		return result;
	}

	private taskWritePermission(user: User, entity: Task): boolean {
		const hasParentWritePermission = this.parentPermission(user, entity, Actions.write);

		return hasParentWritePermission;
	}

	private parentPermission(user: User, entity: Task, action: Actions): boolean {
		let hasParentPermission = false;
		if (entity.lesson) {
			hasParentPermission = this.lessonRule.hasPermission(user, entity.lesson, { action, requiredPermissions: [] });
		} else if (entity.course) {
			hasParentPermission = this.courseRule.hasPermission(user, entity.course, { action, requiredPermissions: [] });
		}

		return hasParentPermission;
	}
}
