import { Injectable } from '@nestjs/common';
import { EntityId, Role } from '@shared/domain';
import { BaseRepo } from '../base.repo';

@Injectable()
export class RoleRepo extends BaseRepo<Role> {
	protected get entityName() {
		return Role;
	}

	cache = 60000;

	async findByName(name: string): Promise<Role> {
		const role = await this._em.findOneOrFail(Role, { name }, { cache: this.cache });
		return role;
	}

	async findById(id: EntityId): Promise<Role> {
		const role = await this._em.findOneOrFail(Role, { id }, { cache: this.cache });

		return role;
	}
}
