import { ValidationError } from '@shared/common';
import { Role, User } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { RoleDto } from '../../role/service/dto/role.dto';
import { ICurrentUser } from '../interface';

export class CurrentUserMapper {
	static userToICurrentUser(accountId: string, user: User, systemId?: string): ICurrentUser {
		const permissions = new Set<string>();
		if (user.roles) {
			user.roles.getItems().forEach((role) => {
				if (role.permissions) {
					role.permissions.forEach((permission) => {
						permissions.add(permission.toString());
					});
				}
			});
		}
		return {
			accountId,
			systemId,
			roles: user.roles.getItems().map((role: Role) => role.name),
			schoolId: user.school.id,
			userId: user.id,
			user: {
				id: user.id,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
				firstName: user.firstName,
				lastName: user.lastName,
				roles: user.roles.getItems().map((role: Role) => {
					return { id: role.id, name: role.name };
				}),
				schoolId: user.school.id,
				permissions: Array.from(permissions),
			},
		};
	}

	static userDoToICurrentUser(accountId: string, user: UserDO, roles: RoleDto[], systemId?: string): ICurrentUser {
		const permissions = new Set<string>();

		if (!user.id || !user.createdAt || !user.updatedAt) {
			throw new ValidationError('user has no ID');
		}

		return {
			accountId,
			systemId,
			roles: user.roleIds,
			schoolId: user.schoolId,
			userId: user.id,
			user: {
				id: user.id,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
				firstName: user.firstName,
				lastName: user.lastName,
				roles: roles.map((role: RoleDto) => {
					return { id: role.id ?? '', name: role.name };
				}),
				schoolId: user.schoolId,
				permissions: Array.from(permissions),
			},
		};
	}
}
