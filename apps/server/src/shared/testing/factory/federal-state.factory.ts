import { County, FederalState, IFederalStateProperties } from '@shared/domain';
import { BaseFactory } from './base.factory';

export const federalStateFactory = BaseFactory.define<FederalState, IFederalStateProperties>(FederalState, () => {
	return {
		name: 'Hamburg',
		abbreviation: 'HH',
		logoUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Coat_of_arms_of_Hamburg.svg/1200px-Coat_of_arms_of_Hamburg.svg.png',
		counties: [
			new County({
				name: 'Hamburg-Mitte',
				countyId: 2000,
				antaresKey: '02000',
			}),
			new County({
				name: 'Altona',
				countyId: 2002,
				antaresKey: '02002',
			}),
		],
		createdAt: new Date(2020, 1),
		updatedAt: new Date(2020, 1),
	};
});
