import { Collection } from '@mikro-orm/core';
import { RoleName } from '@modules/role';
import { Role } from '@modules/role/repo';
import { type UserDo } from '@modules/user';
import { User } from '@modules/user/repo';
import { Inject, Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { AUTHORIZATION_CONFIG_TOKEN, AuthorizationConfig } from '../../authorization.config';

@Injectable()
export class AuthorizationHelper {
	constructor(@Inject(AUTHORIZATION_CONFIG_TOKEN) private readonly config: AuthorizationConfig) {}
	public hasAllPermissions(user: User, requiredPermissions: Permission[]): boolean {
		const usersPermissions = user.resolvePermissions(
			this.config.teacherStudentVisibilityIsConfigurable,
			this.config.teacherStudentVisibilityIsEnabledByDefault
		);
		const hasAllPermissions = requiredPermissions.every((p) => usersPermissions.includes(p));

		return hasAllPermissions;
	}

	public hasAllPermissionsByRole(role: Role, requiredPermissions: Permission[]): boolean {
		const permissions = role.resolvePermissions();
		const hasAllPermissions = requiredPermissions.every((p) => permissions.includes(p));

		return hasAllPermissions;
	}

	public hasOneOfPermissions(user: User, requiredPermissions: Permission[]): boolean {
		// TODO: Wouldn't it make more sense to return true for an empty permissions-array?
		if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) {
			return false;
		}
		const permissions = user.resolvePermissions(
			this.config.teacherStudentVisibilityIsConfigurable,
			this.config.teacherStudentVisibilityIsEnabledByDefault
		);
		const hasPermission = requiredPermissions.some((p) => permissions.includes(p));

		return hasPermission;
	}

	public hasAccessToEntity<T, K extends keyof T>(user: User, entity: T, userRefProps: K[]): boolean {
		const result = userRefProps.some((prop) => this.isUserReferenced(user, entity, prop));

		return result;
	}

	public hasRole(user: User, roleName: RoleName) {
		return user.roles.getItems().some((role) => role.name === roleName);
	}

	private isUserReferenced<T, K extends keyof T>(user: User, entity: T, prop: K): boolean {
		let result = false;

		const reference: T[K] = entity[prop];

		if (reference instanceof Collection) {
			result = reference.contains(user);
		} else if (reference instanceof User) {
			result = reference === user;
		} else if (Array.isArray(reference)) {
			result = reference.includes(user.id);
		} else {
			result = reference === user.id;
		}

		return result;
	}

	public determineDiscoverability(entity: UserDo): boolean {
		const discoverabilitySetting = this.config.teacherVisibilityForExternalTeamInvitation;

		if (discoverabilitySetting === 'disabled') {
			return false;
		}
		if (discoverabilitySetting === 'enabled') {
			return true;
		}

		if (discoverabilitySetting === 'opt-in') {
			return entity.discoverable ?? false;
		}
		if (discoverabilitySetting === 'opt-out') {
			return entity.discoverable ?? true;
		}

		throw new Error('Invalid discoverability setting');
	}
}
