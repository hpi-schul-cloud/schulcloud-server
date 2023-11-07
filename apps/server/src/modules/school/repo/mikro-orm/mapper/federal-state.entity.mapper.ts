import { FederalStateEntity } from '@shared/domain/entity/federal-state.entity';
import { FederalState } from '../../../domain';

export class FederalStateEntityMapper {
	public static mapToDo(entity: FederalStateEntity): FederalState {
		const federalState = new FederalState({
			id: entity.id,
			name: entity.name,
			abbreviation: entity.abbreviation,
			logoUrl: entity.logoUrl,
			counties: entity.counties,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		});

		return federalState;
	}
}
