import { Injectable } from '@nestjs/common';
import { Task, User } from '../entity';
import { RoleName } from '../interface';
import { IPermissionContext } from '../interface/permission';
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
		const isStudent = this.utils.hasRole(user, RoleName.STUDENT);
		const hasPermission = this.utils.hasAllPermissions(user, requiredPermissions);
		const isCreator = this.utils.hasAccessToEntity(user, entity, ['creator']);

		if (!isCreator && isStudent && entity.isDraft()) {
			return false;
		}

		let hasParentPermission = false;
		if (entity.lesson) {
			hasParentPermission = this.lessonRule.hasPermission(user, entity.lesson, { action, requiredPermissions: [] });
		} else if (entity.course) {
			hasParentPermission = this.courseRule.hasPermission(user, entity.course, { action, requiredPermissions: [] });
		}
		const result = hasPermission && (isCreator || hasParentPermission);

		return result;
	}
}
