import { ISchoolProperties, SchoolEntity } from '@shared/domain';
import { BaseFactory } from './base.factory';
import { schoolYearFactory } from './schoolyear.factory';
import { federalStateFactory } from './federal-state.factory';

export const schoolFactory = BaseFactory.define<SchoolEntity, ISchoolProperties>(SchoolEntity, ({ sequence }) => {
	return {
		name: `school #${sequence}`,
		schoolYear: schoolYearFactory.build(),
		federalState: federalStateFactory.build(),
	};
});
