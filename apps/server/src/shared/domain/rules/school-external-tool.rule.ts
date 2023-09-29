import { Injectable } from '@nestjs/common';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { AuthorizationContext, Rule } from '@src/modules/authorization/types';
import { SchoolExternalTool } from '@src/modules/tool/school-external-tool/domain';
import { SchoolExternalToolEntity } from '@src/modules/tool/school-external-tool/entity';
import { User } from '../entity';

@Injectable()
export class SchoolExternalToolRule implements Rule {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, entity: SchoolExternalToolEntity | SchoolExternalTool): boolean {
		const isMatched: boolean = entity instanceof SchoolExternalToolEntity || entity instanceof SchoolExternalTool;

		return isMatched;
	}

	public hasPermission(
		user: User,
		entity: SchoolExternalToolEntity | SchoolExternalTool,
		context: AuthorizationContext
	): boolean {
		let hasPermission: boolean;
		if (entity instanceof SchoolExternalToolEntity) {
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
