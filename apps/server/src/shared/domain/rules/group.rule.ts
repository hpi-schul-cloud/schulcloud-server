import { Injectable } from '@nestjs/common';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { AuthorizationContext, Rule } from '@src/modules/authorization/types';
import { Group } from '@src/modules/group';
import { User } from '../entity';

@Injectable()
export class GroupRule implements Rule<Group> {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, domainObject: Group): boolean {
		const isMatched: boolean = domainObject instanceof Group;

		return isMatched;
	}

	// TODO: ask if this rule "user has to be also in the group" correct? should admin be able to see a group?
	public hasPermission(user: User, domainObject: Group, context: AuthorizationContext): boolean {
		const hasPermission: boolean =
			this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions) &&
			domainObject.users.some((groupUser) => groupUser.userId === user.id);

		return hasPermission;
	}
}
