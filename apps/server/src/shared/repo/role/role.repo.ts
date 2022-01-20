import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId, Role } from '@shared/domain';

@Injectable()
export class RoleRepo {
	cache = 60000;

	constructor(private readonly em: EntityManager) {}

	async findByName(name: string): Promise<Role> {
		const role = await this.em.findOneOrFail(Role, { name }, { cache: this.cache });
		return role;
	}

	async findById(id: EntityId): Promise<Role> {
		const role = await this.em.findOneOrFail(Role, { id }, { cache: this.cache });

		return role;
	}
}
