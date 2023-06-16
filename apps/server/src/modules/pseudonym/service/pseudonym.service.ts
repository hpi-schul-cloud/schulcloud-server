import { Injectable } from '@nestjs/common';
import { EntityId, PseudonymDO } from '@shared/domain';
import { PseudonymsRepo } from '@shared/repo';

@Injectable()
export class PseudonymService {
	constructor(private readonly pseudonymRepo: PseudonymsRepo) {}

	public async findByUserIdAndToolId(userId: EntityId, toolId: EntityId): Promise<PseudonymDO> {
		const pseudonymPromise: Promise<PseudonymDO> = this.pseudonymRepo.findByUserIdAndToolId(userId, toolId);

		return pseudonymPromise;
	}
}
