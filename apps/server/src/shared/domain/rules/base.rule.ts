import { Collection } from '@mikro-orm/core';
import {
	Injectable,
	InternalServerErrorException,
	NotImplementedException,
	UnauthorizedException,
} from '@nestjs/common';
import { BaseEntity } from '../entity';
import type { Role } from '../entity/role.entity';
import { User } from '../entity/user.entity';
import { IEntity, IEntityWithSchool, IPermission, IPermissionContext } from '../interface';
import { BaseDomainObject } from '../interface/domain-object';

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
	hasAccessToEntity<T extends IEntity, K extends keyof T>(user: User, entity: T, userRefProps: K[]) {
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
	hasRole(user: User, roleName: string) {
		if (!user.roles.isInitialized(true)) {
			throw new Error('Roles items are not loaded.');
		}
		return user.roles.getItems().some((role) => {
			return role.name === roleName;
		});
	}
}

enum ErrorMessage {
	MULTIPLE_MATCHES_ARE_NOT_ALLOWED = 'MULTIPLE_MATCHES_ARE_NOT_ALLOWED',
}

export class SingleMatchStrategie {
	errorMessage = ErrorMessage;

	match(layers: BasePermission[]): BasePermission {
		if (layers.length === 0) {
			throw new NotImplementedException();
		}
		if (layers.length > 1) {
			throw new InternalServerErrorException(this.errorMessage.MULTIPLE_MATCHES_ARE_NOT_ALLOWED);
		}
		return layers[0];
	}
}

type PermissionTypes = BaseDomainObject | BaseEntity;

export abstract class BasePermission<T = PermissionTypes> implements IPermission<T> {
	public utils = new AuthorisationUtils();

	public abstract isApplicable(user: User, entity: T, context?: IPermissionContext): boolean;

	/*
	public isApplicable(user: User, entity: permissionTypes, context?: IPermissionContext): boolean {
		const isMatched = this.instance.constructor.name === entity.constructor.name;

		return isMatched;
	} */

	public abstract hasPermission(user: User, entity: T, context?: IPermissionContext): boolean;
}

// I like public this.utils = new AuthorisationUtils
export abstract class BasePermissionManager extends AuthorisationUtils implements IPermission {
	protected permissions: BasePermission[] = [];

	protected matchStrategie = new SingleMatchStrategie();

	private selectPermissions(user: User, entity: PermissionTypes, context?: IPermissionContext): BasePermission[] {
		const permissions = this.permissions.filter((publisher) => publisher.isApplicable(user, entity, context));

		return permissions;
	}

	protected registerPermissions(permissions: BasePermission[]): void {
		this.permissions = [...this.permissions, ...permissions];
	}

	hasPermission(user: User, entity: PermissionTypes, context?: IPermissionContext) {
		const permissions = this.selectPermissions(user, entity, context);
		const permission = this.matchStrategie.match(permissions);

		const hasPermission = permission.hasPermission(user, entity, context);

		return hasPermission;
	}
}
