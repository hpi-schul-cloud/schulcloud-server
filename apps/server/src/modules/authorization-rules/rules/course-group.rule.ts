import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@modules/authorization';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { CourseGroup } from '@shared/domain/entity';
import { CourseRule } from './course.rule';

@Injectable()
export class CourseGroupRule implements Rule<CourseGroup> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		private readonly courseRule: CourseRule,
		injectionService: AuthorizationInjectionService
	) {
		injectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof CourseGroup;

		return isMatched;
	}

	public hasPermission(user: User, object: CourseGroup, context: AuthorizationContext): boolean {
		const { requiredPermissions } = context;

		const hasAllPermissions = this.authorizationHelper.hasAllPermissions(user, requiredPermissions);
		const hasPermission =
			this.authorizationHelper.hasAccessToEntity(user, object, ['students']) ||
			this.courseRule.hasPermission(user, object.course, { action: Action.write, requiredPermissions: [] });

		return hasAllPermissions && hasPermission;
	}
}
