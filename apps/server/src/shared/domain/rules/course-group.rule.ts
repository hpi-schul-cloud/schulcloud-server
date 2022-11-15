import { Injectable } from '@nestjs/common';
import { CourseGroup, User } from '../entity';
import { IAuthorizationContext } from '../interface/rule';
import { Actions } from './actions.enum';
import { BaseRule } from './base-rule';
import { CourseRule } from './course.rule';

@Injectable()
export class CourseGroupRule extends BaseRule<CourseGroup> {
	constructor(private readonly courseRule: CourseRule) {
		super();
	}

	public isApplicable(user: User, entity: CourseGroup): boolean {
		const isMatched = entity instanceof CourseGroup;

		return isMatched;
	}

	public hasPermission(user: User, entity: CourseGroup, context: IAuthorizationContext): boolean {
		const { requiredPermissions } = context;

		const hasAllPermissions = this.utils.hasAllPermissions(user, requiredPermissions);
		const hasPermission =
			this.utils.hasAccessToEntity(user, entity, ['students']) ||
			this.courseRule.hasPermission(user, entity.course, { action: Actions.write, requiredPermissions: [] });

		return hasAllPermissions && hasPermission;
	}
}
