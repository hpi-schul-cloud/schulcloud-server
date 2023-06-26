import { Injectable } from '@nestjs/common';

import { Healthcheck } from '../domain';
import { HealthcheckRepo } from '../repo';

@Injectable()
export class HealthService {
	constructor(private readonly healthcheckRepo: HealthcheckRepo) {}

	async upsertHealthcheckById(id: string): Promise<Healthcheck> {
		return this.healthcheckRepo.upsertById(id);
	}
}
