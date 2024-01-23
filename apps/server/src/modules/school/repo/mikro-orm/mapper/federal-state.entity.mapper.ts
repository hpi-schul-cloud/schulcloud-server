import { FederalStateEntity } from '@shared/domain/entity/federal-state.entity';
import { FederalState } from '../../../domain';
import { CountyEmbeddableMapper } from './county.embeddable.mapper';

export class FederalStateEntityMapper {
	public static mapToDo(entity: FederalStateEntity): FederalState {
		const counties = entity.counties?.map((county) => CountyEmbeddableMapper.mapToDo(county));

		const federalState = new FederalState({
			id: entity.id,
			name: entity.name,
			abbreviation: entity.abbreviation,
			logoUrl: entity.logoUrl,
			counties,
		});

		return federalState;
	}
}
