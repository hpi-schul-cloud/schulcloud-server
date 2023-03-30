import { Injectable } from '@nestjs/common';
import { CourseGroup, User } from '../entity';
import { AuthorizationContext } from '../interface/permission';
import { Actions } from './actions.enum';
import { BasePermission } from './base-permission';
import { CourseRule } from './course.rule';

@Injectable()
export class CourseGroupRule extends BasePermission<CourseGroup> {
	constructor(private readonly courseRule: CourseRule) {
		super();
	}

	public isApplicable(user: User, entity: CourseGroup): boolean {
		const isMatched = entity instanceof CourseGroup;

		return isMatched;
	}

	public hasPermission(user: User, entity: CourseGroup, context: AuthorizationContext): boolean {
		const { requiredPermissions } = context;

		const hasAllPermissions = this.utils.hasAllPermissions(user, requiredPermissions);
		const hasPermission =
			this.utils.hasAccessToEntity(user, entity, ['students']) ||
			this.courseRule.hasPermission(user, entity.course, { action: Actions.write, requiredPermissions: [] });

		return hasAllPermissions && hasPermission;
	}
}
