import { Injectable } from '@nestjs/common';
import { Lesson, User } from '../entity';
import { RoleName } from '../interface';
import { IPermissionContext } from '../interface/permission';
import { BasePermission } from './base-permission';
import { CourseGroupRule } from './course-group.rule';
import { CourseRule } from './course.rule';

@Injectable()
export class LessonRule extends BasePermission<Lesson> {
	constructor(private readonly courseRule: CourseRule, private readonly courseGroupRule: CourseGroupRule) {
		super();
	}

	public isApplicable(user: User, entity: Lesson): boolean {
		const isMatched = entity instanceof Lesson;

		return isMatched;
	}

	public hasPermission(user: User, entity: Lesson, context: IPermissionContext): boolean {
		const { action, requiredPermissions } = context;
		const isStudent = this.utils.hasRole(user, RoleName.STUDENT);

		if (isStudent && entity.hidden) {
			return false;
		}

		const hasPermission = this.utils.hasAllPermissions(user, requiredPermissions);
		let hasCoursePermission = false;
		if (entity.course) {
			hasCoursePermission = this.courseRule.hasPermission(user, entity.course, { action, requiredPermissions: [] });
		} else if (entity.courseGroup) {
			hasCoursePermission = this.courseGroupRule.hasPermission(user, entity.courseGroup, {
				action,
				requiredPermissions: [],
			});
		}
		const result = hasPermission && hasCoursePermission;

		return result;
	}
}
