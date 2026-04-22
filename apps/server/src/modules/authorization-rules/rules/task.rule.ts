import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@modules/authorization';
import { Task } from '@modules/task/repo';
import { User } from '@modules/user/repo';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { CourseRule } from './course.rule';
import { LessonRule } from './lesson.rule';
import { LessonEntity } from '@modules/lesson/repo';
import { CourseEntity } from '@modules/course/repo';
import { Permission } from '@shared/domain/interface/permission.enum';
import { has } from 'lodash';

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

	public hasPermission(user: User, task: Task, context: AuthorizationContext): boolean {
		let hasPermission = false;

		if (context.action === Action.read) {
			hasPermission = this.hasReadAccess(user, task, context);
		} else if (context.action === Action.write) {
			hasPermission = this.hasWriteAccess(user, task, context);
		} else {
			throw new NotImplementedException();
		}

		return hasPermission;
	}

	private hasReadAccess(user: User, task: Task, context: AuthorizationContext): boolean {
		// TODO permission is missing
		const hasPermission  = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);
		const isCreator = this.isCreator(user, task);
		// TODO permission is missing
		const hasInstanceReadOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			...context.requiredPermissions,
		]);

		return hasInstanceReadOperationPermission || (hasPermission && isCreator) || (hasPermission && this.hasParentPermission(user, task, context));
	}

	private hasWriteAccess(user: User, task: Task, context: AuthorizationContext): boolean {
		// TODO permission is missing
		const hasPermission  = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);
		const isCreator = this.isCreator(user, task);
		// TODO permission is missing
		const hasInstanceWriteOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			...context.requiredPermissions,
		]);

		return hasInstanceWriteOperationPermission || (hasPermission && isCreator) || (hasPermission && this.hasParentPermission(user, task, context));
	}

	private hasParentPermission(user: User, task: Task, context: AuthorizationContext): boolean {
		const action = task.isDraft() ? Action.write : context.action;

		if (task.lesson) {
			return this.lessonRule.hasPermission(user, task.lesson, {
				action,
				requiredPermissions: [],
			});	
		}
		if (task.course) {
			return this.courseRule.hasPermission(user, task.course, {
				action,
				requiredPermissions: [],
			});
		}

		return false;
	}

	private isCreator(user: User, task: Task): boolean {
		const isCreator = this.authorizationHelper.hasAccessToEntity(user, task, ['creator']);

		return isCreator;
	}
}
