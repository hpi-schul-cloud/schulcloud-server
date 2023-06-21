import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';
import { EntityId, HealthcheckDO, Healthcheck } from '@shared/domain';

@Injectable()
export class HealthcheckRepo {
	constructor(private readonly em: EntityManager) {}

	async findById(id: EntityId): Promise<HealthcheckDO | null> {
		const healthcheck = await this.em.findOne(Healthcheck, id);

		return this.mapHealthcheckEntityToDO(healthcheck);
	}

	mapHealthcheckEntityToDO(entity: Healthcheck | null): HealthcheckDO | null {
		if (entity === null) {
			return null;
		}

		return new HealthcheckDO(entity.id, entity.updatedAt);
	}
}
