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

	cacheExpiration = 60000;

	async findByName(name: RoleName): Promise<Role> {
		const promise: Promise<Role> = this._em.findOneOrFail(
			Role,
			{ name },
			{ cache: [`roles-cache-byname-${name}`, this.cacheExpiration] }
		);
		return promise;
	}

	async findById(id: EntityId): Promise<Role> {
		const promise: Promise<Role> = this._em.findOneOrFail(Role, { id }, { cache: this.cacheExpiration });
		return promise;
	}

	async findByNames(names: RoleName[]): Promise<Role[]> {
		const promise: Promise<Role[]> = this._em.find(
			Role,
			{ name: { $in: names } },
			{ cache: [`roles-cache-bynames-${names.join('-')}`, this.cacheExpiration] }
		);
		return promise;
	}

	async findByIds(ids: string[]): Promise<Role[]> {
		const promise: Promise<Role[]> = this._em.find(Role, { id: { $in: ids } }, { cache: this.cacheExpiration });
		return promise;
	}
}
