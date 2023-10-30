import { ISchoolProperties, SchoolEntity } from '@shared/domain/entity/school.entity';
import { BaseFactory } from './base.factory';
import { federalStateFactory } from './federal-state.factory';
import { schoolYearFactory } from './schoolyear.factory';

export const schoolFactory = BaseFactory.define<SchoolEntity, ISchoolProperties>(SchoolEntity, ({ sequence }) => {
	return {
		name: `school #${sequence}`,
		schoolYear: schoolYearFactory.build(),
		federalState: federalStateFactory.build(),
	};
});
