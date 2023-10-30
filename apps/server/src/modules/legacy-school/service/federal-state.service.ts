import { Injectable } from '@nestjs/common';
import { FederalStateEntity } from '@shared/domain/entity/federal-state.entity';
import { FederalStateRepo } from '@shared/repo/federalstate/federal-state.repo';

@Injectable()
export class FederalStateService {
	constructor(private readonly federalStateRepo: FederalStateRepo) {}

	// TODO: N21-990 Refactoring: Create domain objects for schoolYear and federalState
	async findFederalStateByName(name: string): Promise<FederalStateEntity> {
		const federalState: FederalStateEntity = await this.federalStateRepo.findByName(name);

		return federalState;
	}
}
