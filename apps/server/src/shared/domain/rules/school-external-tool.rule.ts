import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { AuthorizationContext, Rule, AuthorizationHelper } from '@src/modules/authorization';
import { SchoolExternalTool } from '@src/modules/tool/school-external-tool/domain';
import { SchoolExternalToolEntity } from '@src/modules/tool/school-external-tool/entity';
import { User } from '../entity';

@Injectable()
export class SchoolExternalToolRule implements Rule {
	constructor(
		@Inject(forwardRef(() => AuthorizationHelper)) private readonly authorizationHelper: AuthorizationHelper
	) {}

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
