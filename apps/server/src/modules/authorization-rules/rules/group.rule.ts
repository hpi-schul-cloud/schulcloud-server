import { Action, AuthorizationContext, AuthorizationHelper, AuthorizationInjectionService, Rule } from '@modules/authorization';
import { Group } from '@modules/group';
import { User } from '@modules/user/repo';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';

@Injectable()
export class GroupRule implements Rule<Group> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof Group;

		return isMatched;
	}

	public hasPermission(user: User, group: Group, context: AuthorizationContext): boolean {
		let hasPermission = false;
		
		if (context.action === Action.read) {
			hasPermission = this.hasReadAccess(user, group, context);
		} else if (context.action === Action.write) {
			hasPermission = this.hasWriteAccess(user, group, context);
		} else {
			throw new NotImplementedException();
		}
		
		return hasPermission;
	}

	private hasReadAccess(user: User, group: Group, context: AuthorizationContext): boolean {
		const hasOrganizationAccess = this.hasOrganizationAccess(user, group);
		// TODO: Permissions are missing here
		const hasReadPermission = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);
		const hasInstanceReadOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			...context.requiredPermissions,
		]);

		return hasInstanceReadOperationPermission || (hasReadPermission && hasOrganizationAccess);
	}

	private hasWriteAccess(user: User, group: Group, context: AuthorizationContext): boolean {
		return this.hasReadAccess(user, group, context);
	}

	private hasOrganizationAccess(user: User, group: Group): boolean {
		const hasOrganizationAccess = group.organizationId
			? user.school.id === group.organizationId
			: true;

		return hasOrganizationAccess;
	}


}
