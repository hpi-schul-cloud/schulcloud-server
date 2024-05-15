import { SchoolFeature } from '@shared/domain/types';
import { BaseFactory } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { School, SchoolProps } from '../domain';
import { federalStateFactory } from './federal-state.factory';

export const schoolFactory = BaseFactory.define<School, SchoolProps>(School, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		createdAt: new Date(),
		updatedAt: new Date(),
		name: `school #${sequence}`,
		federalState: federalStateFactory.build(),
		features: new Set<SchoolFeature>(),
	};
});
