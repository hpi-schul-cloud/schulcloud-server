import { County, FederalState, IFederalStateProperties } from '@shared/domain';
import { BaseFactory } from './base.factory';

export const federalStateFactory = BaseFactory.define<FederalState, IFederalStateProperties>(
	FederalState,
	() =>
		new FederalState({
			name: 'Hamburg',
			abbreviation: 'HH',
			logoUrl:
				'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Coat_of_arms_of_Hamburg.svg/1200px-Coat_of_arms_of_Hamburg.svg.png',
			counties: [
				new County({
					name: 'Hamburg-Mitte',
					countyId: '02000',
					antaresKey: '02000',
				}),
				new County({
					name: 'Altona',
					countyId: '02002',
					antaresKey: '02002',
				}),
			],
		})
);
