import { Injectable } from '@nestjs/common';
import { FederalStateRepo } from '@shared/repo';
import { FederalState } from '@shared/domain';

@Injectable()
export class FederalStateService {
	constructor(private readonly federalStateRepo: FederalStateRepo) {}

	async findFederalStateByName(name: string): Promise<FederalState> {
		const federalState: FederalState = await this.federalStateRepo.findByName(name);

		return federalState;
	}

	findAll() {
		return 'federalStates';
	}
}
