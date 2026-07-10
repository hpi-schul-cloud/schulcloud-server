import { Injectable } from '@nestjs/common';

import { HealthCheck } from '../domain';
import { HealthCheckRepo } from '../repo';

@Injectable()
export class HealthService {
	constructor(private readonly healthCheckRepo: HealthCheckRepo) {}

	public async upsertHealthCheckById(id: string): Promise<HealthCheck> {
		const result = await this.healthCheckRepo.upsertById(id);

		return result;
	}
}
