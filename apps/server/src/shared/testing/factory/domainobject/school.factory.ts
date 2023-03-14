import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { DoBaseFactory } from './do-base.factory';

class SchoolFactory extends DoBaseFactory<SchoolDO, SchoolDO> {}

export const schoolDOFactory = SchoolFactory.define(SchoolDO, ({ sequence }) => {
	return {
		name: `schoolName-${sequence}`,
		externalId: '123',
		features: [],
		inMaintenanceSince: new Date(),
		inUserMigration: true,
		oauthMigrationMandatory: new Date(),
		oauthMigrationPossible: new Date(),
		oauthMigrationFinished: new Date(),
		previousExternalId: '456',
		officialSchoolNumber: '789',
		systems: [],
	};
});
