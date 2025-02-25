import { BaseFactory } from '@testing/factory/base.factory';
import { FederalStateEntity, FederalStateProperties } from '../repo';
import { countyEmbeddableFactory } from './county.embeddable.factory';

export const federalStateEntityFactory = BaseFactory.define<FederalStateEntity, FederalStateProperties>(
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
