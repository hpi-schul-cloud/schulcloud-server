import { Injectable } from '@nestjs/common';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { AuthorizationContext, Rule } from '@src/modules/authorization/types';
import { ContextExternalTool, User } from '../entity';
import { ContextExternalToolDO } from '../domainobject';

@Injectable()
export class ContextExternalToolRule implements Rule {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, entity: ContextExternalTool | ContextExternalToolDO): boolean {
		const isMatched: boolean = entity instanceof ContextExternalTool || entity instanceof ContextExternalToolDO;

		return isMatched;
	}

	public hasPermission(
		user: User,
		entity: ContextExternalTool | ContextExternalToolDO,
		context: AuthorizationContext
	): boolean {
		let hasPermission: boolean;
		if (entity instanceof ContextExternalTool) {
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
