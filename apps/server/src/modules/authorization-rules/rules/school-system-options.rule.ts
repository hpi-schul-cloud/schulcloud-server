import { Action, AuthorizationContext, AuthorizationHelper, AuthorizationInjectionService, Rule } from '@modules/authorization';
import { SchoolSystemOptions } from '@modules/legacy-school';
import { User } from '@modules/user/repo';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { Permission } from '@shared/domain/interface/permission.enum';

@Injectable()
export class SchoolSystemOptionsRule implements Rule<SchoolSystemOptions> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched: boolean = object instanceof SchoolSystemOptions;

		return isMatched;
	}

	public hasPermission(user: User, object: SchoolSystemOptions, context: AuthorizationContext): boolean {
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

	private hasReadAccess(user: User, object: SchoolSystemOptions, context: AuthorizationContext): boolean {
		const isUserSchool = this.isUserSchool(user, object);
		const hasSystem = this.hasSystem(user, object);
		// TODO permission is missing
		const hasReadPermission = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);

		// TODO permission is missing
		const hasInstanceReadOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			...context.requiredPermissions,
		]);

		return hasInstanceReadOperationPermission || (hasReadPermission && isUserSchool && hasSystem);
	}

	private hasWriteAccess(user: User, object: SchoolSystemOptions, context: AuthorizationContext): boolean {
		return this.hasReadAccess(user, object, context);
	}

	private isUserSchool(user: User, object: SchoolSystemOptions): boolean {
		const isUserSchool = user.school.id === object.schoolId;
	
		return isUserSchool;
	}

	private hasSystem(user: User, object: SchoolSystemOptions): boolean {
		const hasSystem = user.school.systems.getIdentifiers().includes(object.systemId);

		return hasSystem;
	}
}
