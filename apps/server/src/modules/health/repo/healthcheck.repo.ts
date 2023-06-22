import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';

import { Healthcheck } from '../domain';
import { HealthcheckEntity } from './entity';
import { HealthcheckRepoMapper } from './healthcheck.repo.mapper';

@Injectable()
export class HealthcheckRepo {
	constructor(private readonly em: EntityManager) {}

	async findById(id: string): Promise<Healthcheck | null> {
		const healthcheck = await this.em.findOne(HealthcheckEntity, id);

		return HealthcheckRepoMapper.mapHealthcheckEntityToDo(healthcheck);
	}
}
