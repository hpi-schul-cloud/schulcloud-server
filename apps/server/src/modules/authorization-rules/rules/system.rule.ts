import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@modules/authorization';
import { System } from '@modules/system';
import { User } from '@modules/user/repo';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { Permission } from '@shared/domain/interface/permission.enum';

@Injectable()
export class SystemRule implements Rule<System> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof System;

		return isMatched;
	}

	public hasPermission(user: User, system: System, context: AuthorizationContext): boolean {
		let hasPermission = false;

		if (context.action === Action.read) {
			hasPermission = this.hasReadAccess(user, system, context);
		} else if (context.action === Action.write) {
			hasPermission = this.hasWriteAccess(user, system, context);
		} else {
			throw new NotImplementedException();
		}

		return hasPermission;
	}

	private hasReadAccess(user: User, system: System, context: AuthorizationContext): boolean {
		// TODO permission is missing
		const hasReadPermissions = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);
		const hasInstanceReadOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			Permission.SYSTEM_VIEW,
			...context.requiredPermissions,
		]);
		const hasSystem = this.hasSystem(user, system);

		return hasInstanceReadOperationPermission || (hasReadPermissions && hasSystem);
	}

	private hasWriteAccess(user: User, system: System, context: AuthorizationContext): boolean {
		// TODO permission is missing
		const hasWritePermissions = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);
		const hasInstanceWriteOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			Permission.SYSTEM_EDIT,
			...context.requiredPermissions,
		]);
		const canEdit = this.canEdit(system);
		const hasSystem = this.hasSystem(user, system);

		return (canEdit && hasInstanceWriteOperationPermission) || (hasWritePermissions && canEdit && hasSystem);
	}

	public canEdit(system: unknown): boolean {
		const canEdit =
			typeof system === 'object' &&
			!!system &&
			'ldapConfig' in system &&
			typeof system.ldapConfig === 'object' &&
			!!system.ldapConfig &&
			'provider' in system.ldapConfig &&
			system.ldapConfig.provider === 'general';

		return canEdit;
	}

	private hasSystem(user: User, system: System): boolean {
		const hasSystem = user.school.systems.getIdentifiers().includes(system.id);

		return hasSystem;
	}
}
