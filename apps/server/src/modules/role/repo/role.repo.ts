import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { RoleName } from '../domain';
import { Role } from './role.entity';
import { EntityName } from '@mikro-orm/core';

@Injectable()
export class RoleRepo extends BaseRepo<Role> {
	get entityName(): EntityName<Role> {
		return Role;
	}

	public readonly cacheExpiration = 60000;

	public async findAll(): Promise<Role[]> {
		const roles = await this._em.find(Role, {});
		return roles;
	}

	public async findByName(name: RoleName): Promise<Role> {
		const role = await this._em.findOneOrFail(
			Role,
			{ name },
			{ cache: [`roles-cache-byname-${name}`, this.cacheExpiration] }
		);
		return role;
	}

	public async findById(id: EntityId): Promise<Role> {
		const role = await this._em.findOneOrFail(Role, { id }, { cache: this.cacheExpiration });
		return role;
	}

	public async findByNames(names: RoleName[]): Promise<Role[]> {
		const roles = await this._em.find(
			Role,
			{ name: { $in: names } },
			{ cache: [`roles-cache-bynames-${names.join('-')}`, this.cacheExpiration] }
		);
		return roles;
	}

	public async findByIds(ids: string[]): Promise<Role[]> {
		const roles = await this._em.find(Role, { id: { $in: ids } }, { cache: this.cacheExpiration });
		return roles;
	}
}
