import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { Group } from '@src/modules/group';
import { AuthorizationHelper } from '../service/authorization.helper';
import { AuthorizationContext, Rule } from '../type';

@Injectable()
export class GroupRule implements Rule<Group> {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched: boolean = object instanceof Group;

		return isMatched;
	}

	public hasPermission(user: User, object: Group, context: AuthorizationContext): boolean {
		const hasPermission: boolean =
			this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions) &&
			(object.organizationId ? user.school.id === object.organizationId : true);

		return hasPermission;
	}
}
