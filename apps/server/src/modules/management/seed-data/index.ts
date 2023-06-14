import { BaseEntity } from '@shared/domain';
import { generateFederalStates } from './federalstates';
import { generateRole } from './roles';
import { generateSchools } from './schools';
import { generateSchoolYears } from './schoolyears';
import { generateSystems } from './systems';

export function generateSeedData(injectEnvVars: (s: string) => string) {
	// await setupEntities();
	let collections: { collectionName: string; data: BaseEntity[] }[] = [];
	// create school related collections
	const systems = generateSystems(injectEnvVars);
	const federalStates = generateFederalStates();
	const years = generateSchoolYears();
	const schools = generateSchools({ schoolYears: years, systems });
	// schule,

	// create user related collections
	const roles = generateRole();
	// TODO: create user & accounts
	// TODO: create all other collections

	collections = [
		{ collectionName: 'federalstates', data: federalStates },
		{ collectionName: 'systems', data: systems },
		{ collectionName: 'years', data: years },
		{ collectionName: 'schools', data: schools },

		{ collectionName: 'roles', data: roles },
	];

	return collections;
}
