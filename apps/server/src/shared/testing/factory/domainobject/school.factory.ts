import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { DoBaseFactory } from './do-base.factory';

class SchoolFactory extends DoBaseFactory<SchoolDO, SchoolDO> {}

export const schoolDOFactory = SchoolFactory.define(SchoolDO, ({ sequence }) => {
	return {
		name: `schoolName-${sequence}`,
	};
});
