import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { Group } from '@src/modules/group';
import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@src/modules/authorization';

@Injectable()
export class GroupRule implements Rule<Group> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

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
