import { HealthcheckEntity } from './entity';
import { Healthcheck } from '../domain';

export class HealthcheckRepoMapper {
	static mapHealthcheckEntityToDO(entity: HealthcheckEntity): Healthcheck {
		return new Healthcheck(entity.id, entity.updatedAt);
	}
}
