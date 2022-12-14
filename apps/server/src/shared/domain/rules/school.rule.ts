import { Injectable } from '@nestjs/common';
import { School, User } from '../entity';
import { IPermissionContext } from '../interface/permission';
import { BasePermission } from './base-permission';
import { SchoolDO } from '../domainobject/school.do';

@Injectable()
export class SchoolRule extends BasePermission<School | SchoolDO> {
	public isApplicable(user: User, entity: School | SchoolDO): boolean {
		const isMatched = entity instanceof School || entity instanceof SchoolDO;

		return isMatched;
	}

	public hasPermission(user: User, entity: School | SchoolDO, context: IPermissionContext): boolean {
		const hasPermission =
			this.utils.hasAllPermissions(user, context.requiredPermissions) && user.school.id === entity.id;

		return hasPermission;
	}
}
