import { AuthorizationHelper, AuthorizationInjectionService, Rule } from '@modules/authorization';
import { Instance } from '@modules/instance';
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
		const isApplicable = object instanceof Instance;

		return isApplicable;
	}

	public hasPermission(): boolean {
		/**
		 * Currently we have no user relations for instance,
		 * to figure out write and read permissions.
		 */
		const isNotImplemented = false;

		return isNotImplemented;
	}
}
