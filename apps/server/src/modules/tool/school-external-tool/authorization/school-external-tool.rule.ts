import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@modules/authorization';
import { User } from '@modules/user/repo';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { SchoolExternalTool } from '../domain';
import { SchoolExternalToolEntity } from '../repo';
import { Permission } from '@shared/domain/interface';

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
		let hasPermission = false;

		if (context.action === Action.read) {
			hasPermission = this.hasReadAccess(user, object, context);
		} else if (context.action === Action.write) {
			hasPermission = this.hasWriteAccess(user, object, context);
		} else {
			throw new NotImplementedException();
		}

		return hasPermission;
	}

	private hasReadAccess(
		user: User,
		object: SchoolExternalToolEntity | SchoolExternalTool,
		context: AuthorizationContext
	): boolean {
		const isUserSchool = this.isUserSchool(user, object);
		// Permissions are missing here
		const hasReadPermission = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);
		const hasInstanceReadOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			...context.requiredPermissions,
		]);

		return hasInstanceReadOperationPermission || (hasReadPermission && isUserSchool);
	}

	private hasWriteAccess(
		user: User,
		object: SchoolExternalToolEntity | SchoolExternalTool,
		context: AuthorizationContext
	): boolean {
		return this.hasReadAccess(user, object, context);
	}

	private isUserSchool(user: User, object: SchoolExternalToolEntity | SchoolExternalTool): boolean {
		const schoolId = object instanceof SchoolExternalToolEntity ? object.school.id : object.schoolId;
		const isUserSchool = user.school.id === schoolId;

		return isUserSchool;
	}
}
