import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';

import { HealthCheck } from '../domain';
import { HealthCheckEntity } from './entity';
import { HealthCheckRepoMapper } from './health-check.repo.mapper';

@Injectable()
export class HealthCheckRepo {
	constructor(private readonly em: EntityManager) {}

	async upsertById(id: string): Promise<HealthCheck> {
		const entity = await this.em.upsert(HealthCheckEntity, { id, updatedAt: new Date() });

		return HealthCheckRepoMapper.mapHealthCheckEntityToDO(entity);
	}
}
