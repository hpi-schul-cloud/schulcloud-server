import { SchoolEntity, SchoolProperties } from '@modules/school/repo';
import { BaseFactory } from './base.factory';
import { federalStateFactory } from './federal-state.factory';
import { schoolYearFactory } from './schoolyear.factory';

export const schoolEntityFactory = BaseFactory.define<SchoolEntity, SchoolProperties>(SchoolEntity, ({ sequence }) => {
	return {
		name: `school #${sequence}`,
		currentYear: schoolYearFactory.build(),
		federalState: federalStateFactory.build(),
	};
});
