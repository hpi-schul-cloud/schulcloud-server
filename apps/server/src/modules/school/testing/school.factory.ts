import { BaseFactory } from '@shared/testing';
import { ObjectId } from 'bson';
import { School, SchoolProps } from '../domain';
import { federalStateFactory } from './federal-state.factory';
import { schoolYearFactory } from './school-year.factory';

export const schoolFactory = BaseFactory.define<School, SchoolProps>(School, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		name: `school #${sequence}`,
		currentYear: schoolYearFactory.build(),
		federalState: federalStateFactory.build(),
	};
});
