import { Injectable } from '@nestjs/common';
import type { User } from '../entity';
import { IPermissionContext } from '../interface/permission';
import { BaseRule } from './base.rule';

@Injectable()
export class UserRule extends BaseRule {
	hasPermission(user: User, entity: User, context: IPermissionContext): boolean {
		const hasPermission = this.hasAllPermissions(user, context.requiredPermissions);
		const isOwner = user === entity;

		return hasPermission || isOwner;
	}
}
