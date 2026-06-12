import { FederalStateRepo, FederalStateEntity, FederalStateEntityMapper } from '@modules/school/repo';
import { Injectable } from '@nestjs/common';
import { FederalState } from '../do';

@Injectable()
export class FederalStateService {
	constructor(private readonly federalStateRepo: FederalStateRepo) {}

	// TODO: N21-990 Refactoring: Create domain objects for schoolYear and federalState
	public async findFederalStateByName(name: string): Promise<FederalStateEntity> {
		const federalState: FederalStateEntity = await this.federalStateRepo.findByName(name);

		return federalState;
	}

	public async getOrCreateErwinFederalState(): Promise<FederalState> {
		const federalStateName = 'ErWIngen';

		let federalStateEntity: FederalStateEntity;
		try {
			federalStateEntity = await this.federalStateRepo.findByName(federalStateName);
		} catch (err: unknown) {
			federalStateEntity = new FederalStateEntity({
				name: federalStateName,
				abbreviation: 'EW',
				logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/71/Earth_icon_2.png',
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			federalStateEntity = this.federalStateRepo.create(federalStateEntity);
			await this.federalStateRepo.save(federalStateEntity);
		}

		return FederalStateEntityMapper.mapToDo(federalStateEntity);
	}
}
