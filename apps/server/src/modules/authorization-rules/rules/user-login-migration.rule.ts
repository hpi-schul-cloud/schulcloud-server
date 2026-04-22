import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@modules/authorization';
import { UserLoginMigrationDO } from '@modules/user-login-migration';
import { User } from '@modules/user/repo';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { Permission } from '@shared/domain/interface/permission.enum';

@Injectable()
export class UserLoginMigrationRule implements Rule<UserLoginMigrationDO> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched: boolean = object instanceof UserLoginMigrationDO;

		return isMatched;
	}

	public hasPermission(user: User, userLoginMigration: UserLoginMigrationDO, context: AuthorizationContext): boolean {
		let hasPermission = false;

		if (context.action === Action.read) {
			hasPermission = this.hasReadAccess(user, userLoginMigration, context);
		} else if (context.action === Action.write) {
			hasPermission = this.hasWriteAccess(user, userLoginMigration, context);
		} else {
			throw new NotImplementedException();
		}

		return hasPermission;
	}

	private hasReadAccess(user: User, userLoginMigration: UserLoginMigrationDO, context: AuthorizationContext): boolean {
		const isUserSchool = this.isUserSchool(user, userLoginMigration);
		// TODO: Missing permission
		const hasReadPermission = this.authorizationHelper.hasAllPermissions(user, [...context.requiredPermissions]);

		// TODO: Missing permission
		const hasInstanceReadOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			...context.requiredPermissions,
		]);

		return hasInstanceReadOperationPermission || (hasReadPermission && isUserSchool);
	}

	private hasWriteAccess(user: User, userLoginMigration: UserLoginMigrationDO, context: AuthorizationContext): boolean {
		return this.hasReadAccess(user, userLoginMigration, context);
	}

	private isUserSchool(user: User, userLoginMigration: UserLoginMigrationDO): boolean {
		const isUserSchool = user.school.id === userLoginMigration.schoolId;

		return isUserSchool;
	}
}
