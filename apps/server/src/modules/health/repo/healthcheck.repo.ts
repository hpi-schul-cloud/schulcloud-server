import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';

import { Healthcheck } from '../domain';
import { HealthcheckEntity } from './entity';
import { HealthcheckRepoMapper } from './healthcheck.repo.mapper';

@Injectable()
export class HealthcheckRepo {
	constructor(private readonly em: EntityManager) {}

	async upsertById(id: string): Promise<Healthcheck> {
		const entity = await this.em.upsert(HealthcheckEntity, { id, updatedAt: new Date() });

		return HealthcheckRepoMapper.mapHealthcheckEntityToDo(entity);
	}
}
