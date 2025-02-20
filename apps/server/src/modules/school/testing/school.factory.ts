import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { School, SchoolFeature, SchoolProps } from '../domain';
import { federalStateDoFactory } from './federal-state.do.factory';

export const schoolFactory = BaseFactory.define<School, SchoolProps>(School, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		createdAt: new Date(),
		updatedAt: new Date(),
		name: `school #${sequence}`,
		federalState: federalStateDoFactory.build(),
		features: new Set<SchoolFeature>(),
		systemIds: [],
	};
});
