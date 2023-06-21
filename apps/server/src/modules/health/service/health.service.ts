import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';

import { EntityId, HealthcheckDO } from '@shared/domain';
import { HealthcheckRepo } from '../repo';

@Injectable()
export class HealthService {
	constructor(private readonly healthcheckRepo: HealthcheckRepo) {}

	async findHealthcheckById(id: EntityId): Promise<HealthcheckDO | null> {
		return this.healthcheckRepo.findById(id);
	}
}
