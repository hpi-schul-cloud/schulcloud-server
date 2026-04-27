import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@modules/authorization';
import { RoleName } from '@modules/role';
import { UserDo } from '@modules/user';
import { User } from '@modules/user/repo';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { Permission } from '@shared/domain/interface/permission.enum';

@Injectable()
export class UserRule implements Rule<UserDo> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof UserDo;

		return isMatched;
	}

	public hasPermission(user: User, userDo: UserDo, context: AuthorizationContext): boolean {
		let hasPermission = false;

		if (context.action === Action.read) {
			hasPermission = this.hasReadAccess(user, userDo, context);
		} else if (context.action === Action.write) {
			hasPermission = this.hasWriteAccess(user, userDo, context);
		} else {
			throw new NotImplementedException();
		}

		return hasPermission;
	}

	private hasReadAccess(user: User, userDo: UserDo, context: AuthorizationContext): boolean {
		// Missing permission
		const hasReadPermission = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);
		// Missing permission
		const hasInstanceReadOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			...context.requiredPermissions,
		]);

		const isUser = this.isUserHimself(user, userDo);
		const isVisible = this.isVisibleToExternal(user, userDo);
		const hasLimitingRole = this.hasLimitingRole(user, userDo);

		return (
			hasInstanceReadOperationPermission ||
			(hasReadPermission && isUser) ||
			(hasReadPermission && isVisible && !hasLimitingRole)
		);
	}

	private hasWriteAccess(user: User, userDo: UserDo, context: AuthorizationContext): boolean {
		return this.hasReadAccess(user, userDo, context);
	}

	private hasLimitingRole(user: User, userDo: UserDo): boolean {
		const userRoles = user.roles.getItems().map((role) => role.name);
		const isUserPartlyTeacher = userRoles.includes(RoleName.TEACHER);
		if (isUserPartlyTeacher) {
			return false;
		}

		const isUserAdmin = userRoles.includes(RoleName.ADMINISTRATOR);
		const entityRoles = userDo.roles.map((role) => role.name);
		const isEntityTeacher = entityRoles.includes(RoleName.TEACHER);
		if (isUserAdmin && !isEntityTeacher) {
			return true;
		}

		return false;
	}

	private isUserHimself(user: User, userDo: UserDo): boolean {
		return user.id === userDo.id;
	}

	private isVisibleToExternal(user: User, userDo: UserDo): boolean {
		const isUsersSchool = this.isUserSchool(user, userDo);
		const isDiscoverable = this.isDiscoverable(userDo);

		return isUsersSchool || isDiscoverable;
	}

	private isUserSchool(user: User, userDo: UserDo): boolean {
		return user.school.id === userDo.schoolId;
	}

	private isDiscoverable(userDo: UserDo): boolean {
		const discoverabilitySetting = this.authorizationHelper.getConfig('teacherVisibilityForExternalTeamInvitation');

		if (discoverabilitySetting === 'disabled') {
			return false;
		}

		if (discoverabilitySetting === 'enabled') {
			return true;
		}

		if (discoverabilitySetting === 'opt-in') {
			return userDo.discoverable ?? false;
		}

		if (discoverabilitySetting === 'opt-out') {
			return userDo.discoverable ?? true;
		}

		throw new Error('Invalid discoverability setting');
	}
}
