import { CountyEmbeddable } from '@shared/domain';
import { ObjectId } from 'bson';
import { BaseFactory } from './base.factory';

export const countyEmbeddableFactory = BaseFactory.define<CountyEmbeddable, CountyEmbeddable>(
	CountyEmbeddable,
	({ sequence }) => {
		const county = {
			_id: new ObjectId(),
			name: `County ${sequence}`,
			countyId: sequence,
			antaresKey: `antey ${sequence}`,
		};

		return county;
	}
);
