import { Injectable } from '@nestjs/common';
import { FederalStateDO, FederalStateProps } from '../domainobject/federal-state.do';
import { FederalStateRepo } from '../repo';

@Injectable()
export class FederalStateService {
	constructor(private readonly federalStateRepo: FederalStateRepo) {}

	async findFederalStateByName(name: string): Promise<FederalStateDO> {
		const federalState: FederalStateDO = await this.federalStateRepo.findByName(name);

		return federalState;
	}

	async findAll() {
		const federalStates: FederalStateDO[] = await this.federalStateRepo.findAll();
		return federalStates;
	}

	async create(federalState: FederalStateProps) {
		const createdFederalState = await this.federalStateRepo.save(federalState);
		return createdFederalState;
	}
}
