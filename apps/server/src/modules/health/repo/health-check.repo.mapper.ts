import { HealthCheckEntity } from './entity';
import { HealthCheck } from '../domain';

export class HealthCheckRepoMapper {
	static mapHealthCheckEntityToDO(entity: HealthCheckEntity): HealthCheck {
		return new HealthCheck(entity.id, entity.updatedAt);
	}
}
