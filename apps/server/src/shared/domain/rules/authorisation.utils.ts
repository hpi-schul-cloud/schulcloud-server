import { Collection } from '@mikro-orm/core';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Role, User } from '@shared/domain/entity';
import { IEntityWithSchool, IUserRoleName } from '../interface';

@Injectable()
export class AuthorisationUtils {
	/**
	 * Recursively resolve all roles and permissions of a user.
	 * IMPORTANT: The role collections of the user and nested roles will not be loaded lazily.
	 * Please make sure you populate them before calling this method.
	 */
	resolvePermissions(user: User): string[] {
		if (!user.roles.isInitialized(true)) {
			throw new Error('Roles items are not loaded.');
		}
		const rolesAndPermissions = this.resolvePermissionsByRoles(user.roles.getItems());

		return rolesAndPermissions;
	}

	public resolvePermissionsByRoles(inputRoles: Role[]): string[] {
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

	hasAllPermissions(user: User, requiredPermissions: string[]): boolean {
		if (requiredPermissions.length === 0) {
			return true;
		}
		const usersPermissions = this.resolvePermissions(user);
		const hasPermissions = requiredPermissions.every((p) => usersPermissions.includes(p));
		return hasPermissions;
	}

	/**
	 * @throws UnauthorizedException
	 */
	checkAllPermissions(user: User, requiredPermissions: string[]): void {
		const hasPermission = this.hasAllPermissions(user, requiredPermissions);
		if (hasPermission !== true) {
			throw new UnauthorizedException();
		}
	}

	hasOneOfPermissions(user: User, requiredPermissions: string[]): boolean {
		if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) {
			return false;
		}
		const permissions = this.resolvePermissions(user);
		const hasPermission = requiredPermissions.some((p) => permissions.includes(p));
		return hasPermission;
	}

	/**
	 * @throws UnauthorizedException
	 */
	checkOneOfPermissions(user: User, requiredPermissions: string[]): void {
		const hasPermission = this.hasOneOfPermissions(user, requiredPermissions);
		if (hasPermission !== true) {
			throw new UnauthorizedException();
		}
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
	hasAccessToEntity<T, K extends keyof T>(user: User, entity: T, userRefProps: K[]) {
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

	isSameSchool(user: User, entity: IEntityWithSchool) {
		return user.school === entity.school;
	}

	/**
	 * @throws UnauthorizedException
	 */
	checkSameSchool(user: User, entity: IEntityWithSchool) {
		const isSameSchool = this.isSameSchool(user, entity);
		if (isSameSchool !== true) {
			throw new UnauthorizedException();
		}
	}

	/**
	 * Please not use role instead of permission. It is only for do something for target if it has the role xy.
	 * For each other operations please define, use the string based permissions inside the roles.
	 */
	hasRole(user: User, roleName: IUserRoleName) {
		if (!user.roles.isInitialized(true)) {
			throw new Error('Roles items are not loaded.');
		}
		return user.roles.getItems().some((role) => {
			return role.name === roleName;
		});
	}
}
