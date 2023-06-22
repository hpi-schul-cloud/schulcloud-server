import { HealthcheckEntity } from './entity';
import { Healthcheck } from '../domain';

export class HealthcheckRepoMapper {
	static mapHealthcheckEntityToDo(entity: HealthcheckEntity | null): Healthcheck | null {
		if (entity === null) {
			return null;
		}

		return new Healthcheck(entity.id, entity.updatedAt);
	}
}
