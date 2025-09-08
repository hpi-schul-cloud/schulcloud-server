import { BaseFactory } from '@testing/factory/base.factory';
import { SchoolEntity, SchoolProperties } from '../repo';
import { federalStateEntityFactory } from './federal-state.entity.factory';
import { schoolYearEntityFactory } from './school-year.entity.factory';

export const schoolEntityFactory = BaseFactory.define<SchoolEntity, SchoolProperties>(SchoolEntity, ({ sequence }) => {
	return {
		name: `school #${sequence}`,
		currentYear: schoolYearEntityFactory.build(),
		federalState: federalStateEntityFactory.build(),
	};
});
