import { Action, AuthorizationContext, AuthorizationHelper, AuthorizationInjectionService, Rule } from '@modules/authorization';
import { User } from '@modules/user/repo';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { ContextExternalTool } from '../domain';
import { ContextExternalToolEntity } from '../repo';
import { Permission } from '@shared/domain/interface/permission.enum';

@Injectable()
export class ContextExternalToolRule implements Rule<ContextExternalToolEntity | ContextExternalTool> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof ContextExternalToolEntity || object instanceof ContextExternalTool;

		return isMatched;
	}

	public hasPermission(
		user: User,
		object: ContextExternalToolEntity | ContextExternalTool,
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

	private hasReadAccess(user: User, object: ContextExternalToolEntity | ContextExternalTool, context: AuthorizationContext): boolean {
		const isOneOfTheUserSchools = this.isOneOfTheUserSchools(user, object);
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);
		const hasInstanceReadOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			...context.requiredPermissions,
		]);


		return hasInstanceReadOperationPermission || (hasPermission && isOneOfTheUserSchools);
	}

	private hasWriteAccess(user: User, object: ContextExternalToolEntity | ContextExternalTool, context: AuthorizationContext): boolean {
		return this.hasReadAccess(user, object, context);
	}

	private isOneOfTheUserSchools(user: User, object: ContextExternalToolEntity | ContextExternalTool): boolean {
		const secondarySchools = user.secondarySchools ?? [];
		const secondarySchoolIds = secondarySchools.map(({ school }) => school.id);
		const schoolIds = [user.school.id, ...secondarySchoolIds];
		
		let isUserSchool = false;
		if (object instanceof ContextExternalToolEntity) {
			isUserSchool = schoolIds.includes(object.schoolTool.school.id);
		} else {
			isUserSchool = object.schoolToolRef.schoolId !== undefined && schoolIds.includes(object.schoolToolRef.schoolId);
		}
		
		return isUserSchool;
	}
}
