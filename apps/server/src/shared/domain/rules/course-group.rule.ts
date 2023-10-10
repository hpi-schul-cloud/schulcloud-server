import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { CourseGroup, User } from '@shared/domain/entity';
import { Action, AuthorizationContext, Rule, AuthorizationHelper } from '@src/modules/authorization';
import { CourseRule } from './course.rule';

@Injectable()
export class CourseGroupRule implements Rule {
	constructor(
		@Inject(forwardRef(() => AuthorizationHelper)) private readonly authorizationHelper: AuthorizationHelper,
		private readonly courseRule: CourseRule
	) {}

	public isApplicable(user: User, entity: CourseGroup): boolean {
		const isMatched = entity instanceof CourseGroup;

		return isMatched;
	}

	public hasPermission(user: User, entity: CourseGroup, context: AuthorizationContext): boolean {
		const { requiredPermissions } = context;

		const hasAllPermissions = this.authorizationHelper.hasAllPermissions(user, requiredPermissions);
		const hasPermission =
			this.authorizationHelper.hasAccessToEntity(user, entity, ['students']) ||
			this.courseRule.hasPermission(user, entity.course, { action: Action.write, requiredPermissions: [] });

		return hasAllPermissions && hasPermission;
	}
}
