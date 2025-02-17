import { LegacySchoolDo } from '@modules/legacy-school/domain';
// Remove the eslint-disable after fixing the import issue in EPIC-96
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { federalStateEntityFactory, schoolYearEntityFactory } from '@modules/school/testing';
import { DoBaseFactory } from './do-base.factory';

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
