import { Injectable } from '@nestjs/common';
import { Course, CourseGroup, Lesson, User } from '@shared/domain/entity';
import { AuthorizationHelper } from '../../../modules/authorization/authorization.helper';
import { Action, AuthorizationContext, Rule } from '../../../modules/authorization/types';
import { CourseGroupRule } from './course-group.rule';
import { CourseRule } from './course.rule';

@Injectable()
export class LessonRule implements Rule {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		private readonly courseRule: CourseRule,
		private readonly courseGroupRule: CourseGroupRule
	) {}

	public isApplicable(user: User, entity: Lesson): boolean {
		const isMatched = entity instanceof Lesson;

		return isMatched;
	}

	public isAuthorized(user: User, entity: Lesson, context: AuthorizationContext): boolean {
		const { action, requiredPermissions } = context;
		let hasLessonPermission = false;

		if (action === Action.read) {
			hasLessonPermission = this.lessonReadPermission(user, entity);
		} else if (action === Action.write) {
			hasLessonPermission = this.lessonWritePermission(user, entity);
		}

		const hasUserPermission = this.authorizationHelper.hasAllPermissions(user, requiredPermissions);
		const result = hasUserPermission && hasLessonPermission;

		return result;
	}

	private lessonReadPermission(user: User, entity: Lesson): boolean {
		const isVisible = !entity.hidden;
		let hasParentReadPermission = false;

		if (isVisible) {
			hasParentReadPermission = this.parentPermission(user, entity, Action.read);
		} else {
			hasParentReadPermission = this.parentPermission(user, entity, Action.write);
		}

		return hasParentReadPermission;
	}

	private lessonWritePermission(user: User, entity: Lesson): boolean {
		const hasParentWritePermission = this.parentPermission(user, entity, Action.write);

		return hasParentWritePermission;
	}

	private parentPermission(user: User, entity: Lesson, action: Action): boolean {
		let result = false;

		if (entity.courseGroup) {
			result = this.courseGroupPermission(user, entity.courseGroup, action);
		} else if (entity.course) {
			result = this.coursePermission(user, entity.course, action); // ask course for student = read || teacher, sub-teacher = write
		}

		return result;
	}

	private coursePermission(user: User, entity: Course, action: Action): boolean {
		const result = this.courseRule.isAuthorized(user, entity, { action, requiredPermissions: [] });

		return result;
	}

	private courseGroupPermission(user: User, entity: CourseGroup, action: Action): boolean {
		const result = this.courseGroupRule.isAuthorized(user, entity, {
			action,
			requiredPermissions: [],
		});

		return result;
	}
}
