import { Collection } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Role, User } from '@shared/domain/entity';

@Injectable()
export class AuthorizationHelper {
	public hasAllPermissions(user: User, requiredPermissions: string[]): boolean {
		const usersPermissions = user.resolvePermissions();
		const hasAllPermissions = requiredPermissions.every((p) => usersPermissions.includes(p));

		return hasAllPermissions;
	}

	public hasAllPermissionsByRole(role: Role, requiredPermissions: string[]): boolean {
		const permissions = role.resolvePermissions();
		const hasAllPermissions = requiredPermissions.every((p) => permissions.includes(p));

		return hasAllPermissions;
	}

	public hasOneOfPermissions(user: User, requiredPermissions: string[]): boolean {
		// TODO: Wouldn't it make more sense to return true for an empty permissions-array?
		if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) {
			return false;
		}
		const permissions = user.resolvePermissions();
		const hasPermission = requiredPermissions.some((p) => permissions.includes(p));

		return hasPermission;
	}

	public hasAccessToEntity<T, K extends keyof T>(user: User, entity: T, userRefProps: K[]): boolean {
		const result = userRefProps.some((prop) => this.isUserReferenced(user, entity, prop));

		return result;
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
}
