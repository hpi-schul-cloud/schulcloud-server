import { Injectable } from '@nestjs/common';
import { CourseGroup, User } from '@shared/domain/entity';
import { AuthorizationHelper } from '../service/authorization.helper';
import { Action, AuthorizationContext, Rule } from '../type';
import { CourseRule } from './course.rule';

@Injectable()
export class CourseGroupRule implements Rule<CourseGroup> {
	constructor(private readonly authorizationHelper: AuthorizationHelper, private readonly courseRule: CourseRule) {}

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
