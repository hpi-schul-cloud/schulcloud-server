import { FederalStateRepo, FederalStateEntity } from '@modules/school/repo';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FederalStateService {
	constructor(private readonly federalStateRepo: FederalStateRepo) {}

	// TODO: N21-990 Refactoring: Create domain objects for schoolYear and federalState
	public async findFederalStateByName(name: string): Promise<FederalStateEntity> {
		const federalState: FederalStateEntity = await this.federalStateRepo.findByName(name);

		return federalState;
	}
}
