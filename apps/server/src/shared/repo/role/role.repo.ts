import { Injectable } from '@nestjs/common';
import { EntityId, Role, RoleName } from '@shared/domain';
import { BaseRepo } from '../base.repo';

@Injectable()
export class RoleRepo extends BaseRepo<Role> {
	get entityName() {
		return Role;
	}

	cacheExpiration = 60000;

	async findByName(name: RoleName): Promise<Role> {
		return this._em.findOneOrFail(Role, { name }, { cache: this.cacheExpiration });
	}

	async findById(id: EntityId): Promise<Role> {
		return this._em.findOneOrFail(Role, { id }, { cache: this.cacheExpiration });
	}

	async findByNames(names: RoleName[]): Promise<Role[]> {
		return this._em.find(Role, { name: { $in: names } }, { cache: this.cacheExpiration });
	}

	async findByIds(ids: string[]): Promise<Role[]> {
		return this._em.find(Role, { id: { $in: ids } }, { cache: this.cacheExpiration });
	}
}
