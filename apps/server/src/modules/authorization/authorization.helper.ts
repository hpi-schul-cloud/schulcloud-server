import { Collection } from '@mikro-orm/core';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Role, User } from '@shared/domain/entity';
import { IEntityWithSchool, IUserRoleName } from '../../shared/domain/interface';

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

	/**
	 * Determines whether a user has access to the specified entity by reference props.
	 * @example ```
	 * const user = new User({id: 1})
	 * const entity = new News({id:2, creator: user})
	 * const userRefProps = ['creator']
	 * ```
	 * @param user a user
	 * @param entity An entity to access
	 * @param userRefProps Array of properties in the entity the user is associated with
	 * @returns
	 */
	public hasAccessToEntity<T, K extends keyof T>(user: User, entity: T, userRefProps: K[]): boolean {
		const res = userRefProps.some((prop) => {
			const reference = entity[prop];
			if (reference instanceof Collection) {
				return reference.contains(user);
			}
			if (reference instanceof User) {
				return reference === user;
			}
			return (reference as unknown as string) === user.id;
		});

		return res;
	}

	// todo: hasAccessToDomainObject

	// TODO: Method is unused. Can it be removed?
	public isSameSchool(user: User, entity: IEntityWithSchool) {
		return user.school === entity.school;
	}

	// TODO: Method is unused. Can it be removed?
	/**
	 * @throws UnauthorizedException
	 */
	public checkSameSchool(user: User, entity: IEntityWithSchool) {
		const isSameSchool = this.isSameSchool(user, entity);
		if (isSameSchool !== true) {
			// TODO: Should be ForbiddenException
			throw new UnauthorizedException();
		}
	}

	/**
	 * Please not use role instead of permission. It is only for do something for target if it has the role xy.
	 * For each other operations please define, use the string based permissions inside the roles.
	 */
	// TODO: Method is unused. Can it be removed?
	public hasRole(user: User, roleName: IUserRoleName) {
		if (!user.roles.isInitialized(true)) {
			throw new Error('Roles items are not loaded.');
		}
		return user.roles.getItems().some((role) => role.name === roleName);
	}
}
