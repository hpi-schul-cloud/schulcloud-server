import { ISchoolProperties, School } from '@shared/domain';
import { BaseEntityTestFactory } from './base-entity-test.factory';
import { schoolYearFactory } from './schoolyear.factory';

class SchoolFactory extends BaseEntityTestFactory<School, ISchoolProperties> {}

export const schoolFactory = SchoolFactory.define(School, ({ sequence }) => {
	return {
		name: `school #${sequence}`,
		schoolYear: schoolYearFactory.build(),
	};
});
