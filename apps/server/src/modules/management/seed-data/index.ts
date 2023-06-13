import { BaseEntity } from '@shared/domain';
import { generateFederalStates } from './federalstates';
import { generateRole } from './roles';
import { generateSchoolYears } from './schoolyears';
import { generateSystems } from './systems';

export function generateSeedData(injectEnvVars: (s: string) => string) {
	// await setupEntities();
	let collections: { collectionName: string; data: BaseEntity[] }[] = [];
	// create school related collections
	const systems = generateSystems(injectEnvVars);
	const federalStates = generateFederalStates();
	const years = generateSchoolYears();
	// years
	// schule,

	// create user related collections
	const roles = generateRole();

	collections = [
		{ collectionName: 'federalstates', data: federalStates },
		{ collectionName: 'systems', data: systems },
		{ collectionName: 'years', data: years },
		{ collectionName: 'roles', data: roles },
	];

	return collections;
}
