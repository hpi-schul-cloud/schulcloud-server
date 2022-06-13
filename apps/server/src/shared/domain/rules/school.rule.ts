import { Injectable } from '@nestjs/common';
import { School, User } from '../entity';
import { IPermissionContext } from '../interface/permission';
import { BasePermission } from './base-permission';

@Injectable()
export class SchoolRule extends BasePermission<School> {
	public isApplicable(user: User, entity: School): boolean {
		const isMatched = entity instanceof School;

		return isMatched;
	}

	public hasPermission(user: User, entity: School, context: IPermissionContext): boolean {
		const hasPermission = this.utils.hasAllPermissions(user, context.requiredPermissions) && user.school === entity;

		return hasPermission;
	}
}
