import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@modules/authorization';
import { Instance } from '@modules/instance';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';

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

	public hasPermission(user: User, entity: Instance, context: AuthorizationContext): boolean {
		let hasPermission = false;

		if (context.action === Action.read) {
			hasPermission = this.hasReadAccess(user, context);
		}
		if (context.action === Action.write) {
			hasPermission = this.hasWriteAccess(user, context);
		}

		return hasPermission;
	}

	private hasReadAccess(user: User, context: AuthorizationContext): boolean {
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.INSTANCE_VIEW,
			...context.requiredPermissions,
		]);

		return hasPermission;
	}

	private hasWriteAccess(user: User, context: AuthorizationContext): boolean {
		const hasPermission = false;

		return hasPermission;
	}
}
