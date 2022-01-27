import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Role } from '../entity/role.entity';
import { User } from '../entity/user.entity';

// TODO move to authorization module

@Injectable()
export class PermissionService {
	/**
	 * Recursively resolve all roles and permissions of a user.
	 * IMPORTANT: The role collections of the user and nested roles will not be loaded lazily.
	 * Please make sure you populate them before calling this method.
	 * @param user
	 * @returns
	 */
	resolvePermissions(user: User): string[] {
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

	async hasUserAllSchoolPermissions(user: User, requiredPermissions: string[]): Promise<boolean> {
		if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) {
			return false;
		}
		await user.roles.loadItems();
		const usersPermissions = this.resolvePermissions(user);
		const hasPermissions = requiredPermissions.every((p) => usersPermissions.includes(p));
		return hasPermissions;
	}

	async checkUserHasAllSchoolPermissions(user: User, requiredPermissions: string[]): Promise<void> {
		const hasPermission = await this.hasUserAllSchoolPermissions(user, requiredPermissions);
		if (hasPermission !== true) {
			throw new UnauthorizedException();
		}
	}
}
