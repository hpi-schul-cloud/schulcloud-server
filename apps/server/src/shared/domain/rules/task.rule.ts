import { Injectable } from '@nestjs/common';
import { Task, User } from '../entity';
import { IPermissionContext } from '../interface/permission';
import { BaseRule } from './base.rule';
import { CourseRule } from './course.rule';

@Injectable()
export class TaskRule extends BaseRule {
	constructor(private readonly courseRule: CourseRule) {
		super();
	}

	hasPermission(user: User, entity: Task, context: IPermissionContext): boolean {
		const { action, requiredPermissions } = context;
		const hasPermission = this.hasAllPermissions(user, requiredPermissions);
		const isCreator = this.hasAccessToEntity(user, entity, ['creator']);
		let hasCoursePermission = false;
		if (entity.course) {
			const { course } = entity;
			hasCoursePermission = this.courseRule.hasPermission(user, course, { action, requiredPermissions: [] });
		}
		const result = hasPermission && (isCreator || hasCoursePermission);

		return result;
	}
}
