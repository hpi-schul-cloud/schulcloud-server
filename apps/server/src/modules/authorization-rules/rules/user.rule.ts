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
import { EntityId } from '@shared/domain/types';

type UserEntityOrDo = User | UserDo;

@Injectable()
export class UserRule implements Rule<UserEntityOrDo> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(authorizableUser: User, user: UserEntityOrDo): boolean {
		const isMatched = user instanceof UserDo || user instanceof User;

		return isMatched;
	}

	public hasPermission(authorizableUser: User, user: UserEntityOrDo, context: AuthorizationContext): boolean {
		let hasPermission = false;

		if (context.action === Action.read) {
			hasPermission = this.hasReadAccess(authorizableUser, user, context);
		} else if (context.action === Action.write) {
			hasPermission = this.hasWriteAccess(authorizableUser, user, context);
		} else {
			throw new NotImplementedException();
		}

		return hasPermission;
	}

	private hasReadAccess(authorizableUser: User, user: UserEntityOrDo, context: AuthorizationContext): boolean {
		// Missing permission
		const hasReadPermission = this.authorizationHelper.hasAllPermissions(authorizableUser, context.requiredPermissions);
		// Missing permission
		const hasInstanceReadOperationPermission = this.authorizationHelper.hasAllPermissions(authorizableUser, [
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			...context.requiredPermissions,
		]);

		const isUser = this.isUserHimself(authorizableUser, user);
		const isVisible = this.isVisibleToExternal(authorizableUser, user);
		const hasLimitingRole = this.hasLimitingRole(authorizableUser, user);

		return (
			hasInstanceReadOperationPermission ||
			(hasReadPermission && isUser) ||
			(hasReadPermission && isVisible && !hasLimitingRole)
		);
	}

	private hasWriteAccess(authorizableUser: User, user: UserEntityOrDo, context: AuthorizationContext): boolean {
		return this.hasReadAccess(authorizableUser, user, context);
	}

	private hasLimitingRole(authorizableUser: User, user: UserEntityOrDo): boolean {
		const userRoles = authorizableUser.roles.getItems().map((role) => role.name);
		const isUserPartlyTeacher = userRoles.includes(RoleName.TEACHER);
		if (isUserPartlyTeacher) {
			return false;
		}

		const isUserAdmin = userRoles.includes(RoleName.ADMINISTRATOR);
		const entityRoles = this.getRoleNames(user);
		const isEntityTeacher = entityRoles.includes(RoleName.TEACHER);
		if (isUserAdmin && !isEntityTeacher) {
			return true;
		}

		return false;
	}

	private isUserHimself(authorizableUser: User, user: UserEntityOrDo): boolean {
		return authorizableUser.id === user.id;
	}

	private isVisibleToExternal(authorizableUser: User, user: UserEntityOrDo): boolean {
		const isUsersSchool = this.isUserSchool(authorizableUser, user);
		const isDiscoverable = this.isDiscoverable(user);

		return isUsersSchool || isDiscoverable;
	}

	private isUserSchool(authorizableUser: User, user: UserEntityOrDo): boolean {
		const entitySchoolId = this.getSchoolId(user);

		return authorizableUser.school.id === entitySchoolId;
	}

	private getSchoolId(user: UserEntityOrDo): EntityId {
		if (user instanceof User) {
			return user.school.id;
		}

		return user.schoolId;
	}

	private getRoleNames(user: UserEntityOrDo): RoleName[] {
		if (user instanceof User) {
			return user.roles.getItems().map((role) => role.name);
		}

		return user.roles.map((role) => role.name);
	}

	private isDiscoverable(user: UserEntityOrDo): boolean {
		const discoverabilitySetting = this.authorizationHelper.getConfig('teacherVisibilityForExternalTeamInvitation');

		if ((discoverabilitySetting as string) === 'disabled') {
			return false;
		}

		if ((discoverabilitySetting as string) === 'enabled') {
			return true;
		}

		if ((discoverabilitySetting as string) === 'opt-in') {
			return user.discoverable ?? false;
		}

		if ((discoverabilitySetting as string) === 'opt-out') {
			return user.discoverable ?? true;
		}

		throw new Error('Invalid discoverability setting');
	}
}
