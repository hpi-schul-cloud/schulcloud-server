import { Role, User } from '../entity';
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
}
