import { Injectable } from '@nestjs/common';
import { School, User } from '../entity';
import { IEntity, PermissionPublisher } from '../interface';
import { IPermissionContext } from '../interface/permission';
import { AuthorisationUtils } from './base.rule';

@Injectable()
export class SchoolRule extends AuthorisationUtils implements PermissionPublisher {
	hasPermission(user: User, entity: School, context: IPermissionContext): boolean {
		const hasPermission = this.hasAllPermissions(user, context.requiredPermissions) && user.school === entity;

		return hasPermission;
	}

	checkCondition(user: User, entity: IEntity): boolean {
		const match = entity instanceof School;

		return match;
	}
}
