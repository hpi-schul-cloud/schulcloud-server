import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { FederalState, FederalStateProps } from '../domain';
import { countyFactory } from './county.factory';

export const federalStateDoFactory = BaseFactory.define<FederalState, FederalStateProps>(FederalState, () => {
	return {
		id: new ObjectId().toHexString(),
		name: 'Hamburg',
		abbreviation: 'HH',
		logoUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Coat_of_arms_of_Hamburg.svg/1200px-Coat_of_arms_of_Hamburg.svg.png',
		counties: countyFactory.buildList(2),
		createdAt: new Date(2020, 1),
		updatedAt: new Date(2020, 1),
	};
});
