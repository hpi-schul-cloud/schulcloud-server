import { BaseFactory } from '@testing/factory/base.factory';
import { ObjectId } from '@mikro-orm/mongodb';
import { InstalledLibrary } from '../repo';

type InstalledLibraryProperties = InstalledLibrary;

class H5PEntityLibraryTestFactory extends BaseFactory<InstalledLibrary, InstalledLibraryProperties> {}

export const h5pEntityLibraryTestFactory = H5PEntityLibraryTestFactory.define(InstalledLibrary, ({ sequence }) => {
	const objectId = new ObjectId();
	const library: InstalledLibraryProperties = {
		machineName: `TestLibrary${sequence}`,
		majorVersion: 1,
		minorVersion: 0,
		patchVersion: 0,
		runnable: 1,
		title: `Test Library Title ${sequence}`,
		restricted: false,
		files: [],
		description: 'A test library',
		author: 'Unit Tester',
		addTo: undefined,
		coreApi: { majorVersion: 1, minorVersion: 0 },
		dropLibraryCss: [],
		dynamicDependencies: [],
		editorDependencies: [],
		embedTypes: ['iframe'],
		fullscreen: 0,
		h: 600,
		license: 'MIT',
		metadataSettings: { disable: 0, disableExtraTitleField: 0 },
		preloadedCss: [],
		preloadedDependencies: [],
		preloadedJs: [],
		w: 800,
		requiredExtensions: { sharedState: 0 },
		state: { snapshotSchema: false, opSchema: false, snapshotLogicChecks: false, opLogicChecks: false },
		_id: objectId,
		id: objectId.toHexString(),
		compare: () => 0,
		compareVersions: () => 0,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	return library;
});
