import { Test, TestingModule } from '@nestjs/testing';

import { mkdtemp } from 'fs/promises';
import os from 'os';
import path from 'path';

import rimraf from 'rimraf';
import { Readable } from 'stream';
import { LibraryStorage } from './library-storage';

describe('LibraryStorage', () => {
	let module: TestingModule;
	let adapter: LibraryStorage;

	let tmpDir: string;

	const createParameters = () => {
		const library = {
			machineName: 'test_library',
			majorVersion: 1,
			minorVersion: 2,
			patchVersion: 3,
			runnable: false,
			title: 'Test Library',
		};

		const addon = {
			machineName: 'test_addon',
			majorVersion: 4,
			minorVersion: 5,
			patchVersion: 6,
			runnable: false,
			title: 'Test Addon',
			addTo: {
				player: {
					machineNames: ['test_library'],
				},
			},
		};

		const fakeLib = {
			machineName: 'not_installed',
			majorVersion: 4,
			minorVersion: 5,
			patchVersion: 6,
			runnable: false,
			title: 'Not installed',
		};

		const libWithDependencies = {
			machineName: 'has_dependencies',
			majorVersion: 4,
			minorVersion: 5,
			patchVersion: 6,
			runnable: false,
			title: 'Has Dependencies',
			preloadDependencies: [
				{
					library,
				},
			],
		};

		const filename = '/language/example.json';
		const contents = JSON.stringify({ property: 'value' });
		const invalidFilename = '/nested/../../test.txt';

		return { library, addon, fakeLib, libWithDependencies, filename, invalidFilename, contents };
	};

	beforeAll(async () => {
		const dir = path.join(os.tmpdir(), 'LibraryStorageTest');
		tmpDir = await mkdtemp(dir);

		module = await Test.createTestingModule({
			providers: [{ provide: LibraryStorage, useValue: new LibraryStorage(tmpDir) }],
		}).compile();

		adapter = module.get(LibraryStorage);
	});

	afterAll(async () => {
		await module.close();
		rimraf.sync(tmpDir);
	});

	it('should be defined', () => {
		expect(adapter).toBeDefined();
	});

	describe('when managing a library', () => {
		it('should save library metadata', async () => {
			const { library } = createParameters();

			await adapter.addLibrary(library, false);
		});

		it('should fail to override existing library', async () => {
			const { library } = createParameters();

			const addLib = adapter.addLibrary(library, false);
			await expect(addLib).rejects.toThrowError("Can't add library because it already exists");
		});
	});

	describe('When using addon libraries', () => {
		it('should install addon library', async () => {
			const { addon } = createParameters();
			await adapter.addLibrary(addon, false);
		});

		it('should find addon library', async () => {
			const { addon } = createParameters();
			const addons = await adapter.listAddons();
			expect(addons).toContainEqual(expect.objectContaining(addon));
		});
	});

	describe('when retrieving library metadata', () => {
		it('should retrieve library metadata if it is installed', async () => {
			const { library } = createParameters();

			const returnedLibrary = await adapter.getLibrary(library);
			expect(returnedLibrary).toEqual(expect.objectContaining(library));
		});

		it('should fail to retrieve library metadata when it is not installed', async () => {
			const { fakeLib } = createParameters();

			const getLibrary = adapter.getLibrary(fakeLib);
			await expect(getLibrary).rejects.toThrow('The requested library does not exist');
		});
	});

	describe('when listing libraries', () => {
		it('should return all libraries when no filter is used', async () => {
			const libraries = await adapter.getInstalledLibraryNames();
			expect(libraries.length).toBe(2);
		});

		it('should return all libraries with machinename', async () => {
			const { library } = createParameters();

			const libraries = await adapter.getInstalledLibraryNames(library.machineName);
			expect(libraries.length).toBe(1);
		});
	});

	describe('when checking if a library is installed', () => {
		it('should return true, if the library exists', async () => {
			const { library } = createParameters();
			const installed = await adapter.isInstalled(library);
			expect(installed).toEqual(true);
		});

		it('should return false, if the library does not exists', async () => {
			const { fakeLib } = createParameters();
			const installed = await adapter.isInstalled(fakeLib);
			expect(installed).toEqual(false);
		});
	});

	describe('when adding a file to a library', () => {
		it('should write a file to existing library', async () => {
			const { library, filename, contents } = createParameters();
			await adapter.addFile(library, filename, Readable.from(contents));
		});

		it('should not write a file to non-existing library', async () => {
			const { fakeLib, filename, contents } = createParameters();
			const addFile = adapter.addFile(fakeLib, filename, Readable.from(contents));
			await expect(addFile).rejects.toThrowError('Could not add file to library');
		});

		it('should not allow directory traversal', async () => {
			const { library: dummyLib, invalidFilename, contents } = createParameters();
			const addFile = adapter.addFile(dummyLib, invalidFilename, Readable.from(contents));
			await expect(addFile).rejects.toThrowError(`Filename is invalid ${invalidFilename}`);
		});
	});

	describe('when reading files from a library', () => {
		it('should list files', async () => {
			const { library, filename } = createParameters();

			const files = await adapter.listFiles(library);
			expect(files).toContainEqual(expect.stringContaining(filename));
		});

		it('should check if file exists', async () => {
			const { library, filename } = createParameters();
			await expect(adapter.fileExists(library, filename)).resolves.toEqual(true);
			await expect(adapter.fileExists(library, 'nonExistant')).resolves.toEqual(false);
		});

		it('should return parsed json', async () => {
			const { library, filename, contents } = createParameters();

			const json = await adapter.getFileAsJson(library, filename);
			expect(json).toEqual(JSON.parse(contents));
		});

		it('should return file as string', async () => {
			const { library, filename, contents } = createParameters();

			const fileContent = await adapter.getFileAsString(library, filename);
			expect(fileContent).toEqual(contents);
		});

		it('should return file as stream', async () => {
			const { library, filename, contents } = createParameters();

			const fileStream = await adapter.getFileStream(library, filename);

			const streamContents = await new Promise((resolve, reject) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const chunks: any[] = [];
				fileStream.on('data', (chunk) => chunks.push(chunk));
				fileStream.on('error', reject);
				fileStream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
			});

			expect(streamContents).toEqual(contents);
		});

		describe('when getting file stats', () => {
			it('should get file stats', async () => {
				const { library, filename } = createParameters();

				const fileStats = await adapter.getFileStats(library, filename);
				expect(fileStats).toHaveProperty('birthtime');
				expect(fileStats).toHaveProperty('size');
			});

			it('should fail if file does not exist', async () => {
				const { library } = createParameters();

				const fileStatsPromise = adapter.getFileStats(library, 'nonExistant');
				await expect(fileStatsPromise).rejects.toThrowError('The requested file does not exist');
			});
		});
	});

	describe('when updating a library', () => {
		it('should work if it exists', async () => {
			const { library } = createParameters();

			await adapter.updateLibrary({ ...library, author: 'Test Author' });
		});

		it('should fail if it does not exist', async () => {
			const { fakeLib } = createParameters();

			const addLibrary = adapter.updateLibrary({ ...fakeLib, author: 'Test Author' });
			await expect(addLibrary).rejects.toThrowError('Library is not installed');
		});
	});

	describe('when getting languages', () => {
		it('should return a list of languages', async () => {
			const { library } = createParameters();

			const languages = await adapter.getLanguages(library);
			expect(languages).toContain('example');
		});
	});

	describe('when clearing files', () => {
		it('should remove all files', async () => {
			const { library } = createParameters();

			await adapter.clearFiles(library);
			const files = await adapter.listFiles(library);
			// Only library.json is left
			expect(files).toEqual([expect.stringContaining('library.json')]);
		});

		it('should fail if library does not exist', async () => {
			const { fakeLib } = createParameters();
			const clearFiles = adapter.clearFiles(fakeLib);
			await expect(clearFiles).rejects.toThrowError("Can't clear library files, because it is not installed");
		});
	});

	describe('when deleting a library', () => {
		it("should remove the library and all of it's files", async () => {
			const { library } = createParameters();

			await adapter.deleteLibrary(library);
			await expect(adapter.getLibrary(library)).rejects.toThrowError();
		});

		it('should fail if the library is not installed', async () => {
			const { library } = createParameters();

			await expect(adapter.deleteLibrary(library)).rejects.toThrowError(
				"Can't delete library, because it is not installed"
			);
		});
	});
});
