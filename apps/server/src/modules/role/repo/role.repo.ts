import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { RoleName } from '../domain';
import { Role } from './role.entity';

@Injectable()
export class RoleRepo extends BaseRepo<Role> {
	get entityName() {
		return Role;
	}

	private cacheExpiration = 60000;

	public async findAll(): Promise<Role[]> {
		const promise = await this._em.find(Role, {}); // TODO: evaluate if cache should get introduced ... { cache: [`roles-cache-all`, this.cacheExpiration] }
		return promise;
	}

	public async findByName(name: RoleName): Promise<Role> {
		const promise = await this._em.findOneOrFail(
			Role,
			{ name },
			{ cache: [`roles-cache-byname-${name}`, this.cacheExpiration] }
		);
		return promise;
	}

	public async findById(id: EntityId): Promise<Role> {
		const promise = await this._em.findOneOrFail(Role, { id }, { cache: this.cacheExpiration });
		return promise;
	}

	public async findByNames(names: RoleName[]): Promise<Role[]> {
		const promise = await this._em.find(
			Role,
			{ name: { $in: names } },
			{ cache: [`roles-cache-bynames-${names.join('-')}`, this.cacheExpiration] }
		);
		return promise;
	}

	public async findByIds(ids: string[]): Promise<Role[]> {
		const promise = await this._em.find(Role, { id: { $in: ids } }, { cache: this.cacheExpiration });
		return promise;
	}
}
