import { Injectable } from '@nestjs/common';
import { FederalStateDO } from '../domainobject/federal-state.do';
import { IFederalStateCreate } from '../interface';
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

	async create(federalStateCreate: IFederalStateCreate) {
		const createdFederalState = await this.federalStateRepo.createFederalState(federalStateCreate);
		return createdFederalState;
	}

	async delete(id: string) {
		const deletedFederalState = await this.federalStateRepo.deleteFederalState(id);
		return deletedFederalState;
	}
}
