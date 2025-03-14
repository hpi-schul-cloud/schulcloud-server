import { AuthorizationContext, AuthorizationHelper, AuthorizationInjectionService, Rule } from '@modules/authorization';
import { Instance } from '@modules/instance';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InstanceAdminRule implements Rule<Instance> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof Instance && user.resolvePermissions().includes('INSTANCE_VIEW');

		return isMatched;
	}

	public hasPermission(user: User, entity: Instance, context: AuthorizationContext): boolean {
		// @TODO resolve problem for read and write actions
		const hasPermission = false;
		return hasPermission;
	}
}
