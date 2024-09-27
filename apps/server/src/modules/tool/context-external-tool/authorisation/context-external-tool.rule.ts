import { ContextExternalTool } from '@modules/tool/context-external-tool/domain';
import { ContextExternalToolEntity } from '@modules/tool/context-external-tool/entity';
import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import {
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@src/modules/authorization';

@Injectable()
export class ContextExternalToolRule implements Rule<ContextExternalToolEntity | ContextExternalTool> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched: boolean = object instanceof ContextExternalToolEntity || object instanceof ContextExternalTool;

		return isMatched;
	}

	public hasPermission(
		user: User,
		object: ContextExternalToolEntity | ContextExternalTool,
		context: AuthorizationContext
	): boolean {
		let hasPermission: boolean;
		if (object instanceof ContextExternalToolEntity) {
			hasPermission =
				this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions) &&
				user.school.id === object.schoolTool.school.id;
		} else {
			hasPermission =
				this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions) &&
				user.school.id === object.schoolToolRef.schoolId;
		}
		return hasPermission;
	}
}
