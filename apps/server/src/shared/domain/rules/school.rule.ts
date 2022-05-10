import { Injectable } from '@nestjs/common';
import type { User } from '@shared/domain';
import { School } from '../entity';
import { IPermissionContext } from '../interface/permission';
import { BaseRule } from './base.rule';

@Injectable()
export class SchoolRule extends BaseRule {
	hasPermission(user: User, entity: School, context: IPermissionContext): boolean {
		const hasPermission = this.hasAllPermissions(user, context.requiredPermissions) && user.school === entity;

		return hasPermission;
	}
}
