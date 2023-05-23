import { Injectable } from '@nestjs/common';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { AuthorizationContext, Rule } from '@src/modules/authorization/types';
import { SchoolExternalTool, User } from '../entity';
import { SchoolExternalToolDO } from '../domainobject';

@Injectable()
export class SchoolExternalToolRule implements Rule {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, entity: SchoolExternalTool | SchoolExternalToolDO): boolean {
		const isMatched: boolean = entity instanceof SchoolExternalTool || entity instanceof SchoolExternalToolDO;

		return isMatched;
	}

	public hasPermission(
		user: User,
		entity: SchoolExternalTool | SchoolExternalToolDO,
		context: AuthorizationContext
	): boolean {
		let hasPermission: boolean;
		if (entity instanceof SchoolExternalTool) {
			hasPermission =
				this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions) &&
				user.school.id === entity.school.id;
		} else {
			hasPermission =
				this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions) &&
				user.school.id === entity.schoolId;
		}
		return hasPermission;
	}
}
