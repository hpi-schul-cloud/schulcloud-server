import { Injectable } from '@nestjs/common';
import { FederalStateEntity } from '@shared/domain';
import { FederalStateRepo } from '../repo';

@Injectable()
export class FederalStateService {
	constructor(private readonly federalStateRepo: FederalStateRepo) {}

	async findFederalStateByName(name: string): Promise<FederalStateEntity> {
		const federalState: FederalStateEntity = await this.federalStateRepo.findByName(name);

		return federalState;
	}

	async findAll() {
		const federalStates: FederalStateEntity[] = await this.federalStateRepo.findAll();
		return federalStates;
	}
}
