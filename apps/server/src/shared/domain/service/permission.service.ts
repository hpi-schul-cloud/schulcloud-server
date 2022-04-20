import { Collection } from '@mikro-orm/core';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Role } from '../entity/role.entity';
import { User } from '../entity/user.entity';
import { IEntity, IEntityWithSchool } from '../interface';

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

	hasUserAllSchoolPermissions(user: User, requiredPermissions: string[]): boolean {
		if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) {
			return false;
		}
		const usersPermissions = this.resolvePermissions(user);
		const hasPermissions = requiredPermissions.every((p) => usersPermissions.includes(p));
		return hasPermissions;
	}

	checkUserHasAllSchoolPermissions(user: User, requiredPermissions: string[]): void {
		const hasPermission = this.hasUserAllSchoolPermissions(user, requiredPermissions);
		if (hasPermission !== true) {
			throw new UnauthorizedException();
		}
	}

	hasUserOneOfPermissions(user: User, requiredPermissions: string[]): boolean {
		if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) {
			return false;
		}
		const permissions = this.resolvePermissions(user);
		const hasPermission = requiredPermissions.some((p) => permissions.includes(p));
		return hasPermission;
	}

	checkUserHasOneOfPermissions(user: User, requiredPermissions: string[]): void {
		const hasPermission = this.hasUserOneOfPermissions(user, requiredPermissions);
		if (hasPermission !== true) {
			throw new UnauthorizedException();
		}
	}

	hasUserAccessToEntity(user: User, entity: IEntity, props: string[]) {
		const res = props.some((prop) => {
			if (entity[prop] instanceof Collection) {
				return (entity[prop] as Collection<IEntity, unknown>).contains(user);
			}
			if (entity[prop] instanceof User) {
				return entity[prop] === user;
			}
			return entity[prop] === user.id;
		});

		return res;
	}

	isOnSameSchool(user: User, entity: IEntityWithSchool) {
		return user.school === entity.school;
	}

	hasRole(user: User, roleName: string) {
		if (!user.roles.isInitialized(true)) {
			throw new Error('Roles items are not loaded.');
		}
		return user.roles.getItems().some((role) => {
			return role.name === roleName;
		});
	}
}
