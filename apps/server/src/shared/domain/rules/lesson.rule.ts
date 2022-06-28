import { Injectable } from '@nestjs/common';
import { Lesson, User } from '../entity';
import { IPermissionContext } from '../interface/permission';
import { BasePermission } from './base-permission';
import { CourseRule } from './course.rule';

@Injectable()
export class LessonRule extends BasePermission<Lesson> {
	constructor(private readonly courseRule: CourseRule) {
		super();
	}

	public isApplicable(user: User, entity: Lesson): boolean {
		const isMatched = entity instanceof Lesson;

		return isMatched;
	}

	public hasPermission(user: User, entity: Lesson, context: IPermissionContext): boolean {
		const { action, requiredPermissions } = context;
		const hasPermission = this.utils.hasAllPermissions(user, requiredPermissions);
		const hasCoursePermission = this.courseRule.hasPermission(user, entity.course, { action, requiredPermissions: [] });
		const result = hasPermission && hasCoursePermission;

		return result;
	}
}
