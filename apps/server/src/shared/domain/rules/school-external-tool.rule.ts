import { Injectable } from '@nestjs/common';
import { SchoolExternalToolDO } from '../domainobject/external-tool/school-external-tool.do';
import { SchoolExternalTool, User } from '../entity';
import { AuthorizationContext } from '../interface';
import { AuthorizationHelper } from './authorization.helper';

@Injectable()
export class SchoolExternalToolRule {
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
