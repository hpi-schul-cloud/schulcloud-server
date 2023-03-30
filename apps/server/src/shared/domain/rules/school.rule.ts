import { Injectable } from '@nestjs/common';
import { School, User } from '../entity';
import { AuthorizationContext } from '../interface/permission';
import { BasePermission } from './base-permission';
import { SchoolDO } from '../domainobject/school.do';

@Injectable()
export class SchoolRule extends BasePermission<School | SchoolDO> {
	public isApplicable(user: User, entity: School | SchoolDO): boolean {
		const isMatched: boolean = entity instanceof School || entity instanceof SchoolDO;

		return isMatched;
	}

	public hasPermission(user: User, entity: School | SchoolDO, context: AuthorizationContext): boolean {
		const hasPermission: boolean =
			this.utils.hasAllPermissions(user, context.requiredPermissions) && user.school.id === entity.id;

		return hasPermission;
	}
}
