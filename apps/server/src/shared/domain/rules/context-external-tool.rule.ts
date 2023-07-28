import { Injectable } from '@nestjs/common';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { AuthorizationContext, Rule } from '@src/modules/authorization/types';
import { ContextExternalTool } from '@src/modules/tool/context-external-tool/domain';
import { ContextExternalToolEntity } from '@src/modules/tool/context-external-tool/entity';
import { User } from '../entity';

@Injectable()
export class ContextExternalToolRule implements Rule {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, entity: ContextExternalToolEntity | ContextExternalTool): boolean {
		const isMatched: boolean = entity instanceof ContextExternalToolEntity || entity instanceof ContextExternalTool;

		return isMatched;
	}

	public hasPermission(
		user: User,
		entity: ContextExternalToolEntity | ContextExternalTool,
		context: AuthorizationContext
	): boolean {
		let hasPermission: boolean;
		if (entity instanceof ContextExternalToolEntity) {
			hasPermission =
				this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions) &&
				user.school.id === entity.schoolTool.school.id;
		} else {
			hasPermission =
				this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions) &&
				user.school.id === entity.schoolToolRef.schoolId;
		}
		return hasPermission;
	}
}
