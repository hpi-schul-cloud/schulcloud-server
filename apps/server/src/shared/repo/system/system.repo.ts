import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId, System } from '@shared/domain';

@Injectable()
export class SystemRepo {
	constructor(private readonly em: EntityManager) {}

	async findById(id: EntityId): Promise<System> {
		const user = await this.em.findOneOrFail(System, { id });
		return user;
	}
}
