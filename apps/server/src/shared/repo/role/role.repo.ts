import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId, Role } from '@shared/domain';

@Injectable()
export class RoleRepo {
	cache: 60000;

	constructor(private readonly em: EntityManager) {}

	async findByName(name: string): Promise<Role> {
		const role = await this.em.findOneOrFail(Role, { name }, { cache: this.cache });
		return role;
	}

	async findById(id: EntityId): Promise<Role> {
		const role = await this.em.findOneOrFail(Role, { id }, { cache: this.cache });
		return role;
	}

	async resolvePermissionsFromSubRolesById(id: EntityId): Promise<Role> {
		const role = await this.findById(id);
		let { permissions } = role;

		for (let i = 0; i < role.roles.length; i += 1) {
			// eslint-disable-next-line no-await-in-loop
			const resolvedSubRole = await this.resolvePermissionsFromSubRolesById(role.roles[i].id);
			permissions = [...permissions, ...resolvedSubRole.permissions];
		}

		const uniquePermissions = [...new Set(permissions)];
		role.permissions = uniquePermissions;

		return role;
	}
}
