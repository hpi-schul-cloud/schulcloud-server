import { ObjectId } from '@mikro-orm/mongodb';
import { countyFactory } from '../../testing/county.factory';
import { CountyEmbeddable } from '../federal-state.entity';
import { CountyEmbeddableMapper } from './county.embeddable.mapper';

describe('CountyEmbeddableMapper', () => {
	describe('mapToEntity', () => {
		it('should map to entity', () => {
			const county = countyFactory.build();

			const countyEmbeddable = CountyEmbeddableMapper.mapToEntity(county);

			expect(countyEmbeddable).toBeInstanceOf(CountyEmbeddable);
			expect(countyEmbeddable._id).toBeInstanceOf(ObjectId);
			expect(JSON.stringify(countyEmbeddable._id)).toEqual(JSON.stringify(county.id));
			expect(countyEmbeddable.name).toEqual(county.getProps().name);
			expect(countyEmbeddable.countyId).toEqual(county.getProps().countyId);
			expect(countyEmbeddable.antaresKey).toEqual(county.getProps().antaresKey);
		});
	});
});
