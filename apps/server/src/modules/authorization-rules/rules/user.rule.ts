import { AuthorizationContext, AuthorizationHelper, AuthorizationInjectionService, Rule } from '@modules/authorization';
import { RoleName } from '@modules/role';
import { UserDo } from '@modules/user';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';

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

	public hasPermission(user: User, entity: UserDo, context: AuthorizationContext): boolean {
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);
		if (!hasPermission) {
			return false;
		}

		const isHimself = user.id === entity.id;
		if (isHimself) {
			return true;
		}

		const isUsersSchool = user.school.id === entity.schoolId;
		const isDiscoverable = this.authorizationHelper.determineDiscoverability(entity);
		const isVisible = isUsersSchool || isDiscoverable;

		const hasLimitingRole = this.hasLimitingRole(user, entity);

		return isVisible && !hasLimitingRole;
	}

	private hasLimitingRole(user: User, entity: UserDo): boolean {
		const userRoles = user.roles.getItems().map((role) => role.name);
		const isUserPartlyTeacher = userRoles.includes(RoleName.TEACHER);
		if (isUserPartlyTeacher) {
			return false;
		}

		const isUserAdmin = userRoles.includes(RoleName.ADMINISTRATOR);
		const entityRoles = entity.roles.map((role) => role.name);
		const isEntityTeacher = entityRoles.includes(RoleName.TEACHER);
		if (isUserAdmin && !isEntityTeacher) {
			return true;
		}

		return false;
	}
}
