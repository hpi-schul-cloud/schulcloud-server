import { Injectable } from '@nestjs/common';
import { FederalStateRepo } from '@shared/repo/federal-state';
import { FederalStateDO } from '../domainobject/federal-state.do';
import { FederalStateMapper } from '../mapper/federal-state.mapper';

@Injectable()
export class FederalStateService {
	constructor(private readonly federalStateRepo: FederalStateRepo) {}

	// async findFederalStateByName(name: string): Promise<FederalStateDO> {
	// 	const federalState: FederalStateDO = await this.federalStateRepo.findByName(name);

	// 	return federalState;
	// }

	async findAll(): Promise<FederalStateDO[]> {
		const federalStatesEntity = await this.federalStateRepo.findAll();
		const federalStatesDO = federalStatesEntity.map((e) => FederalStateMapper.mapFederalStateEntityToDO(e));

		return federalStatesDO;
	}

	// async create(federalStateCreate: IFederalStateCreate) {
	// 	const createdFederalState = await this.federalStateRepo.createFederalState(federalStateCreate);
	// 	return createdFederalState;
	// }

	// async delete(id: string) {
	// 	const deletedFederalState = await this.federalStateRepo.deleteFederalState(id);
	// 	return deletedFederalState;
	// }
}
