import { Collection } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Role, User } from '@shared/domain/entity';

@Injectable()
export class AuthorizationHelper {
	/**
	 * Recursively resolve all roles and permissions of a user.
	 * IMPORTANT: The role collections of the user and nested roles will not be loaded lazily.
	 * Please make sure you populate them before calling this method.
	 */
	public resolvePermissions(user: User): string[] {
		if (!user.roles.isInitialized(true)) {
			throw new Error('Roles items are not loaded.');
		}
		const rolesAndPermissions = this.resolvePermissionsByRoles(user.roles.getItems());

		return rolesAndPermissions;
	}

	private resolvePermissionsByRoles(inputRoles: Role[]): string[] {
		let permissions: string[] = [];

		for (let i = 0; i < inputRoles.length; i += 1) {
			const role = inputRoles[i];
			if (!role.roles.isInitialized(true)) {
				throw new Error('Roles items are not loaded.');
			}
			const innerRoles = role.roles.getItems();
			permissions = [...permissions, ...role.permissions];

			if (innerRoles.length > 0) {
				const subPermissions = this.resolvePermissionsByRoles(innerRoles);
				permissions = [...permissions, ...subPermissions];
			}
		}

		permissions = [...new Set(permissions)];

		return permissions;
	}

	public hasAllPermissions(user: User, requiredPermissions: string[]): boolean {
		const usersPermissions = this.resolvePermissions(user);
		const hasAllPermissions = requiredPermissions.every((p) => usersPermissions.includes(p));

		return hasAllPermissions;
	}

	public hasAllPermissionsByRole(role: Role, requiredPermissions: string[]): boolean {
		const usersPermissions = this.resolvePermissionsByRoles([role]);
		const hasAllPermissions = requiredPermissions.every((p) => usersPermissions.includes(p));

		return hasAllPermissions;
	}

	public hasOneOfPermissions(user: User, requiredPermissions: string[]): boolean {
		// TODO: Wouldn't it make more sense to return true for an empty permissions-array?
		if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) {
			return false;
		}
		const permissions = this.resolvePermissions(user);
		const hasPermission = requiredPermissions.some((p) => permissions.includes(p));
		return hasPermission;
	}

	public hasAccessToEntity<T, K extends keyof T>(user: User, entity: T, userRefProps: K[]): boolean {
		const result = userRefProps.some((prop) => this.isUserReferenced(user, entity, prop));

		return result;
	}

	private isUserReferenced<T, K extends keyof T>(user: User, entity: T, prop: K) {
		let result = false;

		const reference = entity[prop];

		if (reference instanceof Collection) {
			result = reference.contains(user);
		} else if (reference instanceof User) {
			result = reference === user;
		} else {
			result = (reference as unknown as string) === user.id;
		}

		return result;
	}

	// todo: hasAccessToDomainObject
}
