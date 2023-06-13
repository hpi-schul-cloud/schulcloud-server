import { BaseEntity } from '@shared/domain';
import { generateRole } from './roles';
import { generateSystems } from './systems';

export function generateSeedData(injectEnvVars: (s: string) => string) {
	// await setupEntities();
	let collections: { collectionName: string; data: BaseEntity[] }[] = [];
	// create school related collections
	const systems = generateSystems(injectEnvVars);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call

	// create user related collections
	const roles = generateRole();
	// federalstate
	// years
	// schule,

	collections = [
		{ collectionName: 'systems', data: systems },
		{ collectionName: 'roles', data: roles },
	];

	return collections;
}
