import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { SchoolExternalToolEntity } from '@modules/tool/school-external-tool/entity';
import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import {
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@src/modules/authorization';

@Injectable()
export class SchoolExternalToolRule implements Rule<SchoolExternalToolEntity | SchoolExternalTool> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched: boolean = object instanceof SchoolExternalToolEntity || object instanceof SchoolExternalTool;

		return isMatched;
	}

	public hasPermission(
		user: User,
		object: SchoolExternalToolEntity | SchoolExternalTool,
		context: AuthorizationContext
	): boolean {
		let hasPermission: boolean;
		if (object instanceof SchoolExternalToolEntity) {
			hasPermission =
				this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions) &&
				user.school.id === object.school.id;
		} else {
			hasPermission =
				this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions) &&
				user.school.id === object.schoolId;
		}
		return hasPermission;
	}
}
