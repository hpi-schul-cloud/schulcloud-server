import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@modules/authorization';
import { Instance } from '@modules/instance';
import type { User } from '@modules/user/repo';
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
		const isMatched = object instanceof Instance;

		return isMatched;
	}

	public hasPermission(user: User, instance: Instance, context: AuthorizationContext): boolean {
		let hasPermission = false;

		if (context.action === Action.read) {
			hasPermission = this.hasReadAccess(user, instance, context);
		}
		if (context.action === Action.write) {
			hasPermission = this.hasWriteAccess(user, instance, context);
		}

		return hasPermission;
	}

	private hasReadAccess(user: User, instance: Instance, context: AuthorizationContext): boolean {
		/**
		 * @notImplemented Currently we have no user relations in instance.
		 */
		const hasReadPermission = false;

		const hasInstanceReadOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.INSTANCE_VIEW,
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			...context.requiredPermissions,
		]);

		return hasInstanceReadOperationPermission || hasReadPermission;
	}

	private hasWriteAccess(user: User, instance: Instance, context: AuthorizationContext): boolean {
		/**
		 * @notImplemented Currently we have no user relations in instance.
		 */
		const hasWritePermission = false;

		const hasInstanceWriteOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.INSTANCE_EDIT,
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			...context.requiredPermissions,
		]);

		return hasInstanceWriteOperationPermission || hasWritePermission;
	}
}
