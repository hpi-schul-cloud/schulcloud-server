import { BaseEntity } from '@shared/domain';
import { generateRole } from './roles';

export function generateSeedData() {
	// await setupEntities();
	let collections: { collectionName: string; data: BaseEntity[] }[] = [];
	// create school related collections
	// system
	// federalstate
	// years
	// schule,

	// create user related collections
	collections = collections.concat({ collectionName: 'roles', data: generateRole() });

	return collections;
}
