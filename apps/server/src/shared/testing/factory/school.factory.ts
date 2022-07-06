import { ISchoolProperties, School } from '@shared/domain';
import { BaseFactory } from './base.factory';
import { schoolYearFactory } from './schoolyear.factory';

export const schoolFactory = BaseFactory.define<School, ISchoolProperties>(School, ({ sequence }) => {
	return {
		name: `school #${sequence}`,
		schoolYear: schoolYearFactory.build(),
	};
});
