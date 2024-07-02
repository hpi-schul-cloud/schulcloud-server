import { ContextExternalTool } from '@modules/tool/context-external-tool/domain';
import { ContextExternalToolEntity } from '@modules/tool/context-external-tool/entity';
import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { AuthorizationHelper } from '../service/authorization.helper';
import { AuthorizationContext, Rule } from '../type';

@Injectable()
export class ContextExternalToolRule implements Rule<ContextExternalToolEntity | ContextExternalTool> {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

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
