import { SchoolEntity, SchoolProperties } from '@shared/domain/entity';
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
