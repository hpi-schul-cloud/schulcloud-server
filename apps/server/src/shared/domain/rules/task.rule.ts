import { Injectable } from '@nestjs/common';
import { Task, User } from '../entity';
import { IPermissionContext } from '../interface/permission';
import { BasePermission } from './base.rule';
import { CourseRule } from './course.rule';

@Injectable()
export class TaskRule extends BasePermission<Task> {
	constructor(private readonly courseRule: CourseRule) {
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
		let hasCoursePermission = false;
		if (entity.course) {
			hasCoursePermission = this.courseRule.hasPermission(user, entity.course, { action, requiredPermissions: [] });
		}
		const result = hasPermission && (isCreator || hasCoursePermission);

		return result;
	}
}
