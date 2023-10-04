import { federalStateFactory } from '@shared/testing';
import { County } from '../entity';
import { FederalStateMapper } from './federal-state.mapper';

describe('federal-state mapper', () => {
	describe('mapCountyEntityToDO', () => {
		it('should map county entity to county do', () => {
			const entity = new County({ name: 'test', countyId: 1, antaresKey: 'test' });
			const domainObject = FederalStateMapper.mapCountyEntityToDO(entity);

			expect(domainObject.name).toEqual(entity.name);
			expect(domainObject.countyId).toEqual(entity.countyId);
			expect(domainObject.antaresKey).toEqual(entity.antaresKey);
		});
	});

	describe('mapFederalStateEntityToDO', () => {
		it('should map federal state entity to federal state do', () => {
			const entity = federalStateFactory.buildWithId();
			const domainObject = FederalStateMapper.mapFederalStateEntityToDO(entity);

			expect(domainObject.name).toEqual(entity.name);
			expect(domainObject.abbreviation).toEqual(entity.abbreviation);
			expect(domainObject.logoUrl).toEqual(entity.logoUrl);
			domainObject.counties?.forEach((county, index) => {
				expect(county.name).toEqual(entity.counties?.at(index)?.name);
				expect(county.countyId).toEqual(entity.counties?.at(index)?.countyId);
				expect(county.antaresKey).toEqual(entity.counties?.at(index)?.antaresKey);
			});
		});
	});
});
