import { DoBaseFactory } from './do-base.factory';
import { SchoolDO } from '../../../domain/domainobject/school.do';

export const schoolDOFactory = DoBaseFactory.define<SchoolDO, SchoolDO>(SchoolDO, ({ sequence }) => {
	return {
		id: `schoolId-${sequence}`,
		name: `schoolName-${sequence}`,
	};
});
