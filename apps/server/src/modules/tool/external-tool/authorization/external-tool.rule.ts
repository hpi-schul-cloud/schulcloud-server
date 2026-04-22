import { Action, AuthorizationContext, AuthorizationHelper, AuthorizationInjectionService, Rule } from '@modules/authorization';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { User } from '@modules/user/repo';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { Permission } from '@shared/domain/interface/permission.enum';

@Injectable()
export class ExternalToolRule implements Rule<ExternalTool> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		injectionService: AuthorizationInjectionService
	) {
		injectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof ExternalTool;

		return isMatched;
	}

	public hasPermission(user: User, externalTool: ExternalTool, context: AuthorizationContext): boolean {
		let hasPermission = false;
		
		if (context.action === Action.read) {
			hasPermission = this.hasReadAccess(user, externalTool, context);
		} else if (context.action === Action.write) {
			hasPermission = this.hasWriteAccess(user, externalTool, context);
		} else {
			throw new NotImplementedException();
		}
		
		return hasPermission;
	}

	private hasReadAccess(user: User, externalTool: ExternalTool, context: AuthorizationContext): boolean {
		// TODO: Permissions are missing here
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);
		const hasInstanceReadOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			...context.requiredPermissions,
		]);

		return hasInstanceReadOperationPermission || hasPermission;
	}

	private hasWriteAccess(user: User, externalTool: ExternalTool, context: AuthorizationContext): boolean {
		return this.hasReadAccess(user, externalTool, context);
	}

}
