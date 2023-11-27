import { BaseFactory } from '@shared/testing';
import { ObjectId } from 'bson';
import { FederalState, FederalStateProps } from '../do';

export const federalStateFactory = BaseFactory.define<FederalState, FederalStateProps>(FederalState, () => {
	return {
		id: new ObjectId().toHexString(),
		name: 'Hamburg',
		abbreviation: 'HH',
		logoUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Coat_of_arms_of_Hamburg.svg/1200px-Coat_of_arms_of_Hamburg.svg.png',
		counties: [
			{
				id: new ObjectId().toHexString(),
				name: 'Hamburg-Mitte',
				countyId: 2000,
				antaresKey: '02000',
			},
			{
				id: new ObjectId().toHexString(),
				name: 'Altona',
				countyId: 2002,
				antaresKey: '02002',
			},
		],
		createdAt: new Date(2020, 1),
		updatedAt: new Date(2020, 1),
	};
});
