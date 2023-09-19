import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { federalStateFactory } from '../federal-state.factory';
import { schoolYearFactory } from '../schoolyear.factory';
import { DoBaseFactory } from './do-base.factory';

class SchoolFactory extends DoBaseFactory<SchoolDO, SchoolDO> {}

export const schoolDOFactory = SchoolFactory.define(SchoolDO, ({ sequence }) => {
	return {
		name: `schoolName-${sequence}`,
		externalId: '123',
		features: [],
		inMaintenanceSince: new Date(2020, 1),
		inUserMigration: true,
		oauthMigrationMandatory: new Date(2020, 1),
		oauthMigrationPossible: new Date(2020, 1),
		oauthMigrationFinished: new Date(2020, 1),
		previousExternalId: '456',
		officialSchoolNumber: '789',
		systems: [],
		federalState: federalStateFactory.build(),
		schoolYear: schoolYearFactory.build(),
	};
});
