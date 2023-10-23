import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain';
import { Group } from '@src/modules/group';
import { AuthorizationContext, Rule } from '../type';
import { AuthorizationHelper } from '../service/authorization.helper';

@Injectable()
export class GroupRule implements Rule<Group> {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, domainObject: Group): boolean {
		const isMatched: boolean = domainObject instanceof Group;

		return isMatched;
	}

	public hasPermission(user: User, domainObject: Group, context: AuthorizationContext): boolean {
		const hasPermission: boolean =
			this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions) &&
			(domainObject.organizationId ? user.school.id === domainObject.organizationId : true);

		return hasPermission;
	}
}
