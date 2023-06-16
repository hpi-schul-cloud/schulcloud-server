import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { DoBaseFactory } from './do-base.factory';
import { federalStateFactory } from '../federal-state.factory';
import { schoolYearFactory } from '../schoolyear.factory';

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
		federalState: federalStateFactory.build(),
		schoolYear: schoolYearFactory.build(),
	};
});
