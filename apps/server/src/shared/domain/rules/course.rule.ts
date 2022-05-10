import { Injectable } from '@nestjs/common';
import { Course, User } from '../entity';
import { IPermissionContext } from '../interface/permission';
import { Actions } from './actions.enum';
import { BaseRule } from './base.rule';

@Injectable()
export class CourseRule extends BaseRule {
	hasPermission(user: User, entity: Course, context: IPermissionContext): boolean {
		const { action, requiredPermissions } = context;
		const hasPermission =
			this.hasAllPermissions(user, requiredPermissions) &&
			this.hasAccessToEntity(
				user,
				entity,
				action === Actions.read
					? ['teachers', 'substitutionTeachers', 'students']
					: ['teachers', 'substitutionTeachers']
			);

		return hasPermission;
	}
}
