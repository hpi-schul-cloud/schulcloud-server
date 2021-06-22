import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId, IPagination } from '@shared/domain';
// import { QueryOrder } from '@mikro-orm/core';
// import { Counted } from '@shared/domain/types';
import { Role } from '../entity';

interface RoleMap {
	[name: string]: Role;
}

// TODO: time reset
class RoleCache {
	cache: RoleMap;

	name: string;

	constructor(name = '') {
		this.cache = {};
		this.name = name;
	}

	get(selector: string): Role {
		return this.cache[selector];
	}

	has(selector: string): boolean {
		return Object.prototype.hasOwnProperty.call(this.cache, selector);
	}

	add(selector: string, role: Role) {
		this.cache[selector] = role;
	}

	// we do not registred changes by calling the old endpoint
	cleanup() {
		this.cache = {};
	}
}

// caching ?
@Injectable()
export class RoleRepo {
	cl1: RoleCache;

	cl2: RoleCache;

	constructor(private readonly em: EntityManager) {
		this.cl1 = new RoleCache('level1');
		this.cl2 = new RoleCache('level2');
	}

	async findByName(name: string): Promise<Role> {
		let role: Role;

		if (this.cl1.has(name)) {
			role = this.cl1.get(name);
		} else {
			role = await this.em.findOneOrFail(Role, { name });
			this.cl1.add(name, role);
		}
		return role;
	}

	async findById(id: EntityId): Promise<Role> {
		let role: Role;

		if (this.cl1.has(id)) {
			role = this.cl1.get(id);
		} else {
			role = await this.em.findOneOrFail(Role, { id });
			this.cl1.add(id, role);
		}
		return role;
	}

	async resolvePermissionsByName(name: string): Promise<Role> {
		if (this.cl2.has(name)) {
			return this.cl2.get(name);
		}

		const role = await this.findByName(name);
		let { permissions } = role;
		const { roles } = role;

		for (let i = 0; i < roles.length; i += 1) {
			const subRoleId = roles[i];
			// eslint-disable-next-line no-await-in-loop
			const { name: subRoleName } = await this.findById(subRoleId);
			// eslint-disable-next-line no-await-in-loop
			const resolvedSubRole = await this.resolvePermissionsByName(subRoleName);
			permissions = [...permissions, ...resolvedSubRole.permissions];
		}

		const uniquePermissions = [...new Set(permissions)];
		role.permissions = uniquePermissions;
		this.cl2.add(name, role);
		return role;
	}
}
