import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId, IPagination } from '@shared/domain';
// import { QueryOrder } from '@mikro-orm/core';
// import { Counted } from '@shared/domain/types';
import { Role } from '../entity';

interface CacheEntry {
	[name: string]: { value: Role; validUntil: number };
}

// TODO: no query handled at the moment
class RoleCache {
	cache: CacheEntry;

	name: string;

	clearInterval: 60000;

	constructor(name = '') {
		this.cache = {};
		this.name = name;
	}

	get(selector: string): Role | undefined {
		const entry = this.cache[selector];
		if (!entry || entry.validUntil < Date.now()) return undefined;
		return entry.value;
	}

	/*
	has(selector: string): boolean {
		return Object.prototype.hasOwnProperty.call(this.cache, selector);
	}
	*/
	add(selector: string, role: Role) {
		this.cache[selector] = {
			value: role,
			validUntil: Date.now() + this.clearInterval, // TODO: test if it is work
		};
	}

	// we do not registred changes by calling the old endpoint
	clear() {
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
		if (this.cl1.get(name)) {
			return this.cl1.get(name) as Role;
		}

		const role = await this.em.findOneOrFail(Role, { name });
		this.cl1.add(name, role);

		return role;
	}

	async findById(id: EntityId): Promise<Role> {
		if (this.cl1.get(id)) {
			return this.cl1.get(id) as Role;
		}

		const role = await this.em.findOneOrFail(Role, { id });
		this.cl1.add(id, role);

		return role;
	}

	async resolvePermissionsByName(name: string): Promise<Role> {
		if (this.cl2.get(name)) {
			return this.cl2.get(name) as Role;
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
