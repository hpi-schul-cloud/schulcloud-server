import { Injectable } from '@nestjs/common';
import { FederalState } from '@shared/domain';
import { FederalStateRepo } from '../repo';

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
