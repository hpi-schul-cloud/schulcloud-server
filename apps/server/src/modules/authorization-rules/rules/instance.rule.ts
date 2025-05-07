import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@modules/authorization';
import { Instance } from '@modules/instance';
import { RoleName } from '@modules/role';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InstanceRule implements Rule<Instance> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof Instance;

		return isMatched;
	}

	public hasPermission(user: User, entity: Instance, context: AuthorizationContext): boolean {
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);

		// As temporary solution until the user with write access to instance added as group, we must check the role.
		if (context.action === Action.write) {
			const hasRole = this.authorizationHelper.hasRole(user, RoleName.SUPERHERO);

			return hasPermission && hasRole;
		}

		return hasPermission;
	}
}
