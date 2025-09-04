import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@modules/authorization';
import { CourseGroupEntity } from '@modules/course/repo';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { CourseRule } from './course.rule';

@Injectable()
export class CourseGroupRule implements Rule<CourseGroupEntity> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		private readonly courseRule: CourseRule,
		injectionService: AuthorizationInjectionService
	) {
		injectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof CourseGroupEntity;

		return isMatched;
	}

	public hasPermission(user: User, object: CourseGroupEntity, context: AuthorizationContext): boolean {
		const { requiredPermissions } = context;

		const hasAllPermissions = this.authorizationHelper.hasAllPermissions(user, requiredPermissions);

		if (!object.course.isInitialized()) {
			throw new Error('Course is not initialized');
		}

		const hasPermission =
			this.authorizationHelper.hasAccessToEntity(user, object, ['students']) ||
			this.courseRule.hasPermission(user, object.course.unwrap(), { action: Action.write, requiredPermissions: [] });

		return hasAllPermissions && hasPermission;
	}
}
