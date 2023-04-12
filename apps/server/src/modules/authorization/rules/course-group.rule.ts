import { Injectable } from '@nestjs/common';
import { CourseGroup, User } from '../../../shared/domain/entity';
import { AuthorizationHelper } from '../authorization.helper';
import { Action, AuthorizationContext, Rule } from '../types';
import { CourseRule } from './course.rule';

@Injectable()
export class CourseGroupRule implements Rule {
	constructor(private readonly authorizationHelper: AuthorizationHelper, private readonly courseRule: CourseRule) {}

	public isApplicable(user: User, entity: CourseGroup): boolean {
		const isMatched = entity instanceof CourseGroup;

		return isMatched;
	}

	public isAuthorized(user: User, entity: CourseGroup, context: AuthorizationContext): boolean {
		const { requiredPermissions } = context;

		const hasAllPermissions = this.authorizationHelper.hasAllPermissions(user, requiredPermissions);
		const hasPermission =
			this.authorizationHelper.hasAccessToEntity(user, entity, ['students']) ||
			this.courseRule.isAuthorized(user, entity.course, { action: Action.write, requiredPermissions: [] });

		return hasAllPermissions && hasPermission;
	}
}
