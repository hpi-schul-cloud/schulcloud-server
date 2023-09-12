import { FederalStateDO, FederalStateProps } from '@src/modules/federal-state/domainobject/federal-state.do';
import { County } from '@src/modules/federal-state/entity';
import { ObjectId } from 'bson';
import { DomainObjectFactory } from './domain-object.factory';

export const federalStateDoFactory = DomainObjectFactory.define<FederalStateDO, FederalStateProps>(
	FederalStateDO,
	() => {
		return {
			name: 'Hamburg',
			id: new ObjectId().toHexString(),

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
	}
);
