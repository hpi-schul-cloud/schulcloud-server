import { Injectable } from '@nestjs/common';
import { Course, User } from '../entity';
import { IEntity, PermissionPublisher } from '../interface';
import { IPermissionContext } from '../interface/permission';
import { Actions } from './actions.enum';
import { AuthorisationUtils } from './base.rule';

@Injectable()
export class CourseRule extends AuthorisationUtils implements PermissionPublisher {
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

	checkCondition(user: User, entity: IEntity): boolean {
		const match = entity instanceof Course;

		return match;
	}
}
