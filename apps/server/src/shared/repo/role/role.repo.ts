import { Injectable } from '@nestjs/common';
import { Role, RoleName } from '@shared/domain';
import { EntityId } from '@shared/domain/types';
import { BaseRepo } from '../base.repo';

@Injectable()
export class RoleRepo extends BaseRepo<Role> {
	get entityName() {
		return Role;
	}

	cacheExpiration = 60000;

	async findByName(name: RoleName): Promise<Role> {
		const promise: Promise<Role> = this._em.findOneOrFail(Role, { name }, { cache: this.cacheExpiration });
		return promise;
	}

	async findById(id: EntityId): Promise<Role> {
		const promise: Promise<Role> = this._em.findOneOrFail(Role, { id }, { cache: this.cacheExpiration });
		return promise;
	}

	async findByNames(names: RoleName[]): Promise<Role[]> {
		const promise: Promise<Role[]> = this._em.find(Role, { name: { $in: names } }, { cache: this.cacheExpiration });
		return promise;
	}

	async findByIds(ids: string[]): Promise<Role[]> {
		const promise: Promise<Role[]> = this._em.find(Role, { id: { $in: ids } }, { cache: this.cacheExpiration });
		return promise;
	}
}
