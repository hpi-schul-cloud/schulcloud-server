import { Injectable } from '@nestjs/common';
import { Task, User } from '../entity';
import { IEntity, PermissionPublisher } from '../interface';
import { IPermissionContext } from '../interface/permission';
import { AuthorisationUtils } from './base.rule';
import { CourseRule } from './course.rule';

@Injectable()
export class TaskRule extends AuthorisationUtils implements PermissionPublisher {
	constructor(private readonly courseRule: CourseRule) {
		super();
	}

	hasPermission(user: User, entity: Task, context: IPermissionContext): boolean {
		const { action, requiredPermissions } = context;
		const hasPermission = this.hasAllPermissions(user, requiredPermissions);
		const isCreator = this.hasAccessToEntity(user, entity, ['creator']);
		let hasCoursePermission = false;
		if (entity.course) {
			hasCoursePermission = this.courseRule.hasPermission(user, entity.course, { action, requiredPermissions: [] });
		}
		const result = hasPermission && (isCreator || hasCoursePermission);

		return result;
	}

	checkCondition(user: User, entity: IEntity): boolean {
		const match = entity instanceof Task;

		return match;
	}
}
