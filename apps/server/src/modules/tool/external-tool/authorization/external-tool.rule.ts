import { AuthorizationContext, AuthorizationHelper, AuthorizationInjectionService, Rule } from '@modules/authorization';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ExternalToolRule implements Rule<ExternalTool> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		injectionService: AuthorizationInjectionService
	) {
		injectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched: boolean = object instanceof ExternalTool;

		return isMatched;
	}

	public hasPermission(user: User, object: ExternalTool, context: AuthorizationContext): boolean {
		const hasPermission: boolean = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);

		return hasPermission;
	}
}
