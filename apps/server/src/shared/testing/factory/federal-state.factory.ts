import { FederalStateEntity, FederalStateProperties } from '@shared/domain';
import { BaseFactory } from './base.factory';
import { countyEmbeddableFactory } from './county.embeddable.factory';

export const federalStateFactory = BaseFactory.define<FederalStateEntity, FederalStateProperties>(
	FederalStateEntity,
	() => {
		return {
			name: 'Hamburg',
			abbreviation: 'HH',
			logoUrl:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Coat_of_arms_of_Hamburg.svg/1200px-Coat_of_arms_of_Hamburg.svg.png',
			counties: countyEmbeddableFactory.buildList(2),
			createdAt: new Date(2020, 1),
			updatedAt: new Date(2020, 1),
		};
	}
);
