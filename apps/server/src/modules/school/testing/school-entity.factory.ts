import { BaseFactory } from '@testing/factory/base.factory';
import { federalStateFactory } from '@testing/factory/federal-state.factory';
import { SchoolEntity, SchoolProperties } from '../repo';
import { schoolYearEntityFactory } from './school-year.entity.factory';

export const schoolEntityFactory = BaseFactory.define<SchoolEntity, SchoolProperties>(SchoolEntity, ({ sequence }) => {
	return {
		name: `school #${sequence}`,
		currentYear: schoolYearEntityFactory.build(),
		federalState: federalStateFactory.build(),
	};
});
