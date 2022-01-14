import { Injectable } from '@nestjs/common';
import { Role, User } from '../entity';

@Injectable()
export class PermissionService {
	/**
	 * Recursively resolve all roles and permissions of a user.
	 * IMPORTANT: The role collections of the user and nested roles will not be loaded lazily.
	 * Please make sure you populate them before calling this method.
	 * @param user
	 * @returns
	 */
	resolveRolesAndPermissions(user: User): [Role[], string[]] {
		const rolesAndPermissions = this.resolveRolesAndPermissionsByRoles(user.roles.getItems());

		return rolesAndPermissions;
	}

	private resolveRolesAndPermissionsByRoles(inputRoles: Role[]): [Role[], string[]] {
		let roles: Role[] = inputRoles;
		let permissions: string[] = [];

		for (let i = 0; i < inputRoles.length; i += 1) {
			const role = inputRoles[i];
			const innerRoles = role.roles.getItems();
			permissions = [...permissions, ...role.permissions];

			if (innerRoles.length > 0) {
				const [subRoles, subPermissions] = this.resolveRolesAndPermissionsByRoles(innerRoles);
				roles = [...roles, ...subRoles];
				permissions = [...permissions, ...subPermissions];
			}
		}

		roles = [...new Set(roles)];
		permissions = [...new Set(permissions)];

		return [roles, permissions];
	}
}
