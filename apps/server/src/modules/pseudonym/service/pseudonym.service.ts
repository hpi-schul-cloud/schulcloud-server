import { Injectable } from '@nestjs/common';
import { EntityId, PseudonymDO } from '@shared/domain';
import { PseudonymsRepo } from '@shared/repo';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PseudonymService {
	constructor(private readonly pseudonymRepo: PseudonymsRepo) {}

	public async findByUserIdAndToolId(userId: EntityId, toolId: EntityId): Promise<PseudonymDO> {
		const pseudonym: Promise<PseudonymDO> = this.pseudonymRepo.findByUserIdAndToolIdOrFail(userId, toolId);

		return pseudonym;
	}

	public async requestPseudonym(userId: EntityId, toolId: EntityId): Promise<PseudonymDO> {
		let pseudonym: PseudonymDO | null = await this.pseudonymRepo.findByUserIdAndToolId(userId, toolId);

		if (!pseudonym) {
			pseudonym = new PseudonymDO({
				pseudonym: uuidv4(),
				userId,
				toolId,
			});

			pseudonym = await this.pseudonymRepo.save(pseudonym);
		}

		return pseudonym;
	}
}
