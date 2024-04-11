import { CountyEmbeddable } from '@shared/domain/entity';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from './base.factory';

export const countyEmbeddableFactory = BaseFactory.define<CountyEmbeddable, CountyEmbeddable>(
	CountyEmbeddable,
	({ sequence }) => {
		const county = {
			_id: new ObjectId(),
			name: `County ${sequence}`,
			countyId: sequence,
			antaresKey: `antaresKey ${sequence}`,
		};

		return county;
	}
);
