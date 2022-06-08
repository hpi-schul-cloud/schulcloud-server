import { Injectable } from '@nestjs/common';
import { User } from '../entity';
import { IEntity, PermissionLayer } from '../interface';
import { IPermissionContext } from '../interface/permission';
import { AuthorisationUtils } from './base.rule';

@Injectable()
export class UserRule extends AuthorisationUtils implements PermissionLayer {
	hasPermission(user: User, entity: User, context: IPermissionContext): boolean {
		const hasPermission = this.hasAllPermissions(user, context.requiredPermissions);
		const isOwner = user === entity;

		return hasPermission || isOwner;
	}

	checkCondition(user: User, entity: IEntity): boolean {
		const match = entity instanceof User;

		return match;
	}
}
