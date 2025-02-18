import { federalStateEntityFactory, schoolYearEntityFactory } from '@modules/school/testing';
import { DoBaseFactory } from '@testing/factory/domainobject';
import { LegacySchoolDo } from '../domain';

class LegacySchoolFactory extends DoBaseFactory<LegacySchoolDo, LegacySchoolDo> {}

export const legacySchoolDoFactory = LegacySchoolFactory.define(LegacySchoolDo, ({ sequence }) => {
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
		federalState: federalStateEntityFactory.build(),
		schoolYear: schoolYearEntityFactory.build(),
	};
});
