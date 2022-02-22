import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { System } from '@shared/domain';

@Injectable()
export class SystemRepo {
	constructor(private readonly em: EntityManager) {}

	async findById(id: string): Promise<System> {
		const system = await this.em.findOneOrFail(System, { id });
		return system;
	}
}
