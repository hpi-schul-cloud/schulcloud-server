import { Injectable } from '@nestjs/common';
import { FederalStateRepo } from '@shared/repo';
import { FederalState } from '@shared/domain';

@Injectable()
export class FederalStateService {
	constructor(private readonly federalStateRepo: FederalStateRepo) {}

	// TODO: N21-990 Refactoring: Create domain objects for schoolYear and federalState
	async findFederalStateByName(name: string): Promise<FederalState> {
		const federalState: FederalState = await this.federalStateRepo.findByName(name);
		return federalState;
	}
}
