import { SchoolEntity, SchoolProperties } from '@shared/domain';
import { BaseFactory } from './base.factory';
import { federalStateFactory } from './federal-state.factory';
import { schoolYearFactory } from './schoolyear.factory';

export const schoolFactory = BaseFactory.define<SchoolEntity, SchoolProperties>(SchoolEntity, ({ sequence }) => {
	return {
		name: `school #${sequence}`,
		schoolYear: schoolYearFactory.build(),
		federalState: federalStateFactory.build(),
	};
});
