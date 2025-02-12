import { BaseFactory } from '@testing/factory/base.factory';
import { federalStateFactory } from '@testing/factory/federal-state.factory';
import { schoolYearFactory } from '@testing/factory/schoolyear.factory';
import { SchoolEntity, SchoolProperties } from '../repo';

export const schoolEntityFactory = BaseFactory.define<SchoolEntity, SchoolProperties>(SchoolEntity, ({ sequence }) => {
	return {
		name: `school #${sequence}`,
		currentYear: schoolYearFactory.build(),
		federalState: federalStateFactory.build(),
	};
});
