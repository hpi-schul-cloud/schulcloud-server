import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId, Role } from '@shared/domain';

@Injectable()
export class RoleRepo {
	cache = 60000;

	constructor(private readonly em: EntityManager) {}

	async findByName(name: string): Promise<Role> {
		const role = await this.em.findOneOrFail(Role, { name }, { cache: this.cache });
		return role;
	}

	async findById(id: EntityId): Promise<Role> {
		const role = await this.em.findOneOrFail(Role, { id }, { cache: this.cache });

		return role;
	}

	resolvePermissionsByRoles(inputRoles: Role[]): string[] {
		let permissions: string[] = [];

		for (let i = 0; i < inputRoles.length; i += 1) {
			const role = inputRoles[i];
			const subRoles = role.roles.getItems();
			permissions = [...permissions, ...role.permissions];

			if (subRoles.length > 0) {
				const subPermissions = this.resolvePermissionsByRoles(subRoles);
				permissions = [...permissions, ...subPermissions];
			}
		}

		permissions = [...new Set(permissions)];

		return permissions;
	}
}
