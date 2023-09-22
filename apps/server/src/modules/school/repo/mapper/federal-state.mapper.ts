import { FederalStateEntity } from '@shared/domain';
import { FederalState } from '../../domain/do';

export class FederalStateMapper {
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
