import { Injectable, NotImplementedException } from '@nestjs/common';
import { Course, CourseGroup, LessonEntity, User } from '@shared/domain/entity';
import { AuthorizationHelper } from '../service/authorization.helper';
import { Action, AuthorizationContext, Rule } from '../type';
import { CourseGroupRule } from './course-group.rule';
import { CourseRule } from './course.rule';

@Injectable()
export class LessonRule implements Rule<LessonEntity> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		private readonly courseRule: CourseRule,
		private readonly courseGroupRule: CourseGroupRule
	) {}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof LessonEntity;

		return isMatched;
	}

	public hasPermission(user: User, object: LessonEntity, context: AuthorizationContext): boolean {
		const { action, requiredPermissions } = context;
		let hasLessonPermission = false;

		if (action === Action.read) {
			hasLessonPermission = this.lessonReadPermission(user, object);
		} else if (action === Action.write) {
			hasLessonPermission = this.lessonWritePermission(user, object);
		} else {
			throw new NotImplementedException('Action is not supported.');
		}

		const hasUserPermission = this.authorizationHelper.hasAllPermissions(user, requiredPermissions);
		const result = hasUserPermission && hasLessonPermission;

		return result;
	}

	private lessonReadPermission(user: User, entity: LessonEntity): boolean {
		const isVisible = !entity.hidden;
		let hasParentReadPermission = false;

		if (isVisible) {
			hasParentReadPermission = this.parentPermission(user, entity, Action.read);
		} else {
			hasParentReadPermission = this.parentPermission(user, entity, Action.write);
		}

		return hasParentReadPermission;
	}

	private lessonWritePermission(user: User, entity: LessonEntity): boolean {
		const hasParentWritePermission = this.parentPermission(user, entity, Action.write);

		return hasParentWritePermission;
	}

	private parentPermission(user: User, entity: LessonEntity, action: Action): boolean {
		let result: boolean;

		if (entity.courseGroup) {
			result = this.courseGroupPermission(user, entity.courseGroup, action);
		} else if (entity.course) {
			result = this.coursePermission(user, entity.course, action); // ask course for student = read || teacher, sub-teacher = write
		} else {
			result = false;
		}

		return result;
	}

	private coursePermission(user: User, entity: Course, action: Action): boolean {
		const result = this.courseRule.hasPermission(user, entity, { action, requiredPermissions: [] });

		return result;
	}

	private courseGroupPermission(user: User, entity: CourseGroup, action: Action): boolean {
		const result = this.courseGroupRule.hasPermission(user, entity, {
			action,
			requiredPermissions: [],
		});

		return result;
	}
}
