import { type HealthCheckEntity } from './entity';
import { HealthCheck } from '../domain';

export class HealthCheckRepoMapper {
	public static mapHealthCheckEntityToDO(entity: HealthCheckEntity): HealthCheck {
		return new HealthCheck(entity.id, entity.updatedAt);
	}
}
