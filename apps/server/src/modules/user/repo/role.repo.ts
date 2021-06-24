import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { Role } from '../entity';

interface CacheEntry {
	[name: string]: { value: Role; validUntil: number };
}

// TODO: replace with https://mikro-orm.io/docs/caching/
export class RoleCache {
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

	add(selector: string, role: Role): void {
		this.cache[selector] = {
			value: role,
			validUntil: Date.now() + this.clearInterval,
		};
	}

	clear(): void {
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

	async resolvePermissionsFromSubRolesById(id: EntityId): Promise<Role> {
		if (this.cl2.get(id)) {
			return this.cl2.get(id) as Role;
		}

		const role = await this.findById(id);
		let { permissions } = role;

		for (let i = 0; i < role.roles.length; i += 1) {
			// eslint-disable-next-line no-await-in-loop
			const resolvedSubRole = await this.resolvePermissionsFromSubRolesById(role.roles[i]);
			permissions = [...permissions, ...resolvedSubRole.permissions];
		}

		const uniquePermissions = [...new Set(permissions)];
		role.permissions = uniquePermissions;
		this.cl2.add(id, role);
		return role;
	}
}
