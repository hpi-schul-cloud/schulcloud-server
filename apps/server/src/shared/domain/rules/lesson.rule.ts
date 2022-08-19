import { Injectable } from '@nestjs/common';
import { Course, CourseGroup, Lesson, User } from '../entity';
import { IPermissionContext } from '../interface/permission';
import { Actions } from './actions.enum';
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

	/* public hasPermission(user: User, entity: Lesson, context: IPermissionContext): boolean {
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
	} */

	public hasPermission(user: User, entity: Lesson, context: IPermissionContext): boolean {
		const { action, requiredPermissions } = context;
		let hasLessonPermission = false;

		if (Actions.read === action) {
			hasLessonPermission = this.lessonReadPermission(user, entity);
		} else if (Actions.write === action) {
			hasLessonPermission = this.lessonWritePermission(user, entity);
		}

		const hasUserPermission = this.utils.hasAllPermissions(user, requiredPermissions);
		const result = hasUserPermission && hasLessonPermission;

		return result;
	}

	private lessonReadPermission(user: User, entity: Lesson): boolean {
		const isVisible = !entity.hidden;
		let hasParentReadPermission = false;

		if (isVisible) {
			hasParentReadPermission = this.parentPermission(user, entity, Actions.read);
		} else {
			hasParentReadPermission = this.parentPermission(user, entity, Actions.write);
		}

		const result = hasParentReadPermission;

		return result;
	}

	private lessonWritePermission(user: User, entity: Lesson): boolean {
		const hasParentWritePermission = this.parentPermission(user, entity, Actions.write);

		const result = hasParentWritePermission;

		return result;
	}

	private parentPermission(user: User, entity: Lesson, action: Actions): boolean {
		let result = false;

		if (entity.courseGroup) {
			result = this.courseGroupPermission(user, entity.courseGroup, action);
		} else if (entity.course) {
			result = this.coursePermission(user, entity.course, action); // ask course for student = read || teacher, sub-teacher = write
		}

		return result;
	}

	private coursePermission(user: User, entity: Course, action: Actions): boolean {
		const result = this.courseRule.hasPermission(user, entity, { action, requiredPermissions: [] });

		return result;
	}

	private courseGroupPermission(user: User, entity: CourseGroup, action: Actions): boolean {
		const result = this.courseGroupRule.hasPermission(user, entity, {
			action,
			requiredPermissions: [],
		});

		return result;
	}
}
