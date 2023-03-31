import { Injectable } from '@nestjs/common';
import { SchoolDO } from '../domainobject/school.do';
import { School, User } from '../entity';
import { AuthorizationContext } from '../interface/permission';
import { AuthorizationHelper } from './authorization.helper';

@Injectable()
export class SchoolRule {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, entity: School | SchoolDO): boolean {
		const isMatched: boolean = entity instanceof School || entity instanceof SchoolDO;

		return isMatched;
	}

	public hasPermission(user: User, entity: School | SchoolDO, context: AuthorizationContext): boolean {
		const hasPermission: boolean =
			this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions) && user.school.id === entity.id;

		return hasPermission;
	}
}
