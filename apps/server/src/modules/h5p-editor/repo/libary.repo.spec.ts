import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';

import { ILibraryMetadata } from '@lumieducation/h5p-server';
import { LibraryRepo } from './library.repo';
import { FileMetadata, InstalledLibrary } from '../entity';

describe('LibraryRepo', () => {
	let module: TestingModule;
	let libraryRepo: LibraryRepo;
	let addonLib: InstalledLibrary;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [InstalledLibrary] })],
			providers: [LibraryRepo],
		}).compile();
		libraryRepo = module.get(LibraryRepo);
		em = module.get(EntityManager);

		const testingLibMetadata: ILibraryMetadata = {
			runnable: false,
			title: '',
			patchVersion: 3,
			machineName: 'testing',
			majorVersion: 1,
			minorVersion: 2,
		};
		const testingLib = new InstalledLibrary(testingLibMetadata);
		testingLib.files.push(
			new FileMetadata('file1', new Date(), 2),
			new FileMetadata('file2', new Date(), 4),
			new FileMetadata('file3', new Date(), 6)
		);

		const addonLibMetadata: ILibraryMetadata = {
			runnable: false,
			title: '',
			patchVersion: 3,
			machineName: 'addon',
			majorVersion: 1,
			minorVersion: 2,
		};
		addonLib = new InstalledLibrary(addonLibMetadata);
		addonLib.addTo = { player: { machineNames: [testingLib.machineName] } };
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	it('should save a Library', async () => {
		const saveSpy = jest.spyOn(libraryRepo, 'save').mockResolvedValueOnce(undefined);
		await libraryRepo.createLibrary(addonLib);
		expect(saveSpy).toHaveBeenCalledWith(addonLib);
		saveSpy.mockRestore();
	});
});
