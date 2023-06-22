import { Injectable } from '@nestjs/common';

import { Healthcheck } from '../domain';
import { HealthcheckRepo } from '../repo';

@Injectable()
export class HealthService {
	constructor(private readonly healthcheckRepo: HealthcheckRepo) {}

	async findHealthcheckById(id: string): Promise<Healthcheck | null> {
		return this.healthcheckRepo.findById(id);
	}
}
