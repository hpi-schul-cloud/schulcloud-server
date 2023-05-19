import { Test, TestingModule } from '@nestjs/testing';

import { ILibraryMetadata, ILibraryName } from '@lumieducation/h5p-server';
import { mkdtemp } from 'fs/promises';
import fs from 'node:fs/promises';
import os from 'os';
import path from 'path';
import rimraf from 'rimraf';
import { Readable } from 'stream';

import { LibraryStorage } from './libraryStorage';

describe('LibraryStorage', () => {
	let module: TestingModule;
	let adapter: LibraryStorage;

	let tmpDir: string;

	const createTestData = () => {
		const createLib = (name: string, major: number, minor: number, patch: number): ILibraryMetadata => {
			return {
				machineName: name,
				majorVersion: major,
				minorVersion: minor,
				patchVersion: patch,
				runnable: false,
				title: name,
			};
		};

		const metadataToName = ({ machineName, majorVersion, minorVersion }: ILibraryMetadata): ILibraryName => {
			return {
				machineName,
				majorVersion,
				minorVersion,
			};
		};

		const testingLib = createLib('testing', 1, 2, 3);

		const addonLib = createLib('addon', 1, 2, 3);
		addonLib.addTo = { player: { machineNames: [testingLib.machineName] } };

		const circularA = createLib('circular_a', 1, 2, 3);
		const circularB = createLib('circular_b', 1, 2, 3);
		circularA.preloadedDependencies = [metadataToName(circularB)];
		circularB.editorDependencies = [metadataToName(circularA)];

		const fakeLibraryName: ILibraryName = { machineName: 'fake', majorVersion: 2, minorVersion: 3 };

		const testingLibDependentA = createLib('first_dependent', 2, 5, 6);
		testingLibDependentA.dynamicDependencies = [metadataToName(testingLib)];
		const testingLibDependentB = createLib('second_dependent', 2, 5, 6);
		testingLibDependentB.preloadedDependencies = [metadataToName(testingLib)];

		const libWithNonExistingDependency = createLib('fake_dependency', 2, 5, 6);
		libWithNonExistingDependency.editorDependencies = [fakeLibraryName];

		return {
			libraries: [
				testingLib,
				addonLib,
				circularA,
				circularB,
				testingLibDependentA,
				testingLibDependentB,
				libWithNonExistingDependency,
			],
			names: {
				testingLib,
				addonLib,
				fakeLibraryName,
			},
		};
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
	});

	afterEach(() => {
		rimraf.sync(tmpDir);
	});

	it('should be defined', () => {
		expect(adapter).toBeDefined();
	});

	describe('when managing library metadata', () => {
		const setup = async (addLibrary = true) => {
			const {
				names: { testingLib },
			} = createTestData();

			if (addLibrary) {
				await adapter.addLibrary(testingLib, false);
			}

			return { testingLib };
		};

		describe('when adding library', () => {
			it('should succeed', async () => {
				await setup();
			});

			it('should fail to override existing library', async () => {
				const { testingLib } = await setup();

				const addLib = adapter.addLibrary(testingLib, false);
				await expect(addLib).rejects.toThrowError("Can't add library because it already exists");
			});

			it('should fail on IO errors', async () => {
				const { testingLib } = await setup(false);

				jest.spyOn(fs, 'mkdir').mockImplementationOnce(() => {
					throw new Error('Could not create directory');
				});

				const addLibrary = adapter.addLibrary(testingLib, false);
				await expect(addLibrary).rejects.toThrowError('Could not create directory');
			});
		});

		describe('when getting metadata', () => {
			it('should succeed if library existst', async () => {
				const { testingLib } = await setup();

				const returnedLibrary = await adapter.getLibrary(testingLib);
				expect(returnedLibrary).toEqual(expect.objectContaining(testingLib));
			});

			it("should fail if library doesn't exist", async () => {
				const { testingLib } = await setup(false);

				const getLibrary = adapter.getLibrary(testingLib);
				await expect(getLibrary).rejects.toThrowError('The requested library does not exist');
			});
		});

		describe('when checking installed status', () => {
			it('should return true if library is installed', async () => {
				const { testingLib } = await setup();

				const installed = await adapter.isInstalled(testingLib);
				expect(installed).toBe(true);
			});

			it("should return false if library isn't installed", async () => {
				const { testingLib } = await setup(false);

				const installed = await adapter.isInstalled(testingLib);
				expect(installed).toBe(false);
			});
		});

		describe('when updating metadata', () => {
			it('should update metadata', async () => {
				const { testingLib } = await setup();

				testingLib.author = 'Test Author';
				const updatedLibrary = await adapter.updateLibrary(testingLib);
				const retrievedLibrary = await adapter.getLibrary(testingLib);
				expect(retrievedLibrary).toEqual(updatedLibrary);
			});

			it("should fail if library doesn't exist", async () => {
				const { testingLib } = await setup(false);

				const updateLibrary = adapter.updateLibrary(testingLib);
				await expect(updateLibrary).rejects.toThrowError('Library is not installed');
			});
		});

		describe('when updating additional metadata', () => {
			it('should return true if data has changed', async () => {
				const { testingLib } = await setup();

				const updated = await adapter.updateAdditionalMetadata(testingLib, { restricted: true });
				expect(updated).toBe(true);
			});

			it("should return false if data hasn't changed", async () => {
				const { testingLib } = await setup();

				const updated = await adapter.updateAdditionalMetadata(testingLib, { restricted: false });
				expect(updated).toBe(false);
			});

			it('should fail if data could not be updated', async () => {
				const { testingLib } = await setup();

				jest.spyOn(fs, 'writeFile').mockImplementationOnce(() => {
					throw new Error('Could not write file');
				});

				const updateMetadata = adapter.updateAdditionalMetadata(testingLib, { restricted: true });
				await expect(updateMetadata).rejects.toThrowError('Could not update metadata');
			});
		});

		describe('when deleting library', () => {
			it('should succeed if library existst', async () => {
				const { testingLib } = await setup();

				await adapter.deleteLibrary(testingLib);
				await expect(adapter.getLibrary(testingLib)).rejects.toThrow();
			});

			it("should fail if library doesn't existst", async () => {
				const { testingLib } = await setup(false);

				const deleteLibrary = adapter.deleteLibrary(testingLib);
				await expect(deleteLibrary).rejects.toThrowError("Can't delete library, because it is not installed");
			});
		});
	});

	describe('When getting library dependencies', () => {
		const setup = async () => {
			const { libraries, names } = createTestData();

			for await (const library of libraries) {
				await adapter.addLibrary(library, false);
			}

			return names;
		};

		it('should find addon libraries', async () => {
			const { addonLib } = await setup();

			const addons = await adapter.listAddons();
			expect(addons).toContainEqual(expect.objectContaining(addonLib));
		});

		it('should count dependencies', async () => {
			await setup();

			const dependencies = await adapter.getAllDependentsCount();
			expect(dependencies).toEqual({ 'circular_a-1.2': 1, 'testing-1.2': 2, 'fake-2.3': 1 });
		});

		it('should count dependents for single library', async () => {
			const { testingLib } = await setup();

			const count = await adapter.getDependentsCount(testingLib);
			expect(count).toBe(2);
		});

		it('should count dependencies for library without dependents', async () => {
			const { addonLib } = await setup();

			const count = await adapter.getDependentsCount(addonLib);
			expect(count).toBe(0);
		});
	});

	describe('when listing libraries', () => {
		const setup = async () => {
			const {
				libraries,
				names: { testingLib },
			} = createTestData();

			for await (const library of libraries) {
				await adapter.addLibrary(library, false);
			}

			return { libraries, testingLib };
		};

		it('should return all libraries when no filter is used', async () => {
			const { libraries } = await setup();

			const allLibraries = await adapter.getInstalledLibraryNames();
			expect(allLibraries.length).toBe(libraries.length);
		});

		it('should return all libraries with machinename', async () => {
			const { testingLib } = await setup();

			const allLibraries = await adapter.getInstalledLibraryNames(testingLib.machineName);
			expect(allLibraries.length).toBe(1);
		});
	});

	describe('when managing files', () => {
		const setup = async (addFiles = true) => {
			const {
				names: { testingLib },
			} = createTestData();

			const testFile = {
				name: 'test/abc.json',
				content: JSON.stringify({ property: 'value' }),
			};

			if (addFiles) {
				await adapter.addLibrary(testingLib, false);
				await adapter.addFile(testingLib, testFile.name, Readable.from(testFile.content));
			}

			return { testingLib, testFile };
		};

		describe('when adding files', () => {
			it('should work', async () => {
				await setup();
			});

			it('should fail if library is not installed', async () => {
				const { testingLib, testFile } = await setup(false);

				const addFile = adapter.addFile(testingLib, testFile.name, Readable.from(testFile.content));
				await expect(addFile).rejects.toThrowError('Could not add file to library');
			});

			it('should fail on illegal filename', async () => {
				const { testingLib } = await setup();

				const filenames = ['../abc.json', '/test/abc.json'];

				await Promise.all(
					filenames.map((filename) => {
						const addFile = adapter.addFile(testingLib, filename, Readable.from(''));
						return expect(addFile).rejects.toThrowError('Illegal filename');
					})
				);
			});
		});

		it('should list all files', async () => {
			const { testingLib, testFile } = await setup();

			const files = await adapter.listFiles(testingLib);
			expect(files).toContainEqual(expect.stringContaining(testFile.name));
		});

		describe('when checking if file exists', () => {
			it('should return true if it exists', async () => {
				const { testingLib, testFile } = await setup();

				const exists = await adapter.fileExists(testingLib, testFile.name);
				expect(exists).toBe(true);
			});

			it("should return false if it doesn't  exist", async () => {
				const { testingLib, testFile } = await setup(false);

				const exists = await adapter.fileExists(testingLib, testFile.name);
				expect(exists).toBe(false);
			});
		});

		describe('when clearing files', () => {
			it('should remove all files', async () => {
				const { testingLib } = await setup();

				await adapter.clearFiles(testingLib);
				const files = await adapter.listFiles(testingLib);
				expect(files).toEqual([expect.stringContaining('library.json')]);
			});

			it("should fail if library doesn't exist", async () => {
				const { testingLib } = await setup(false);

				const clearFiles = adapter.clearFiles(testingLib);
				await expect(clearFiles).rejects.toThrowError("Can't clear library files, because it is not installed");
			});
		});

		describe('when retrieving files', () => {
			it('should return parsed json', async () => {
				const { testingLib, testFile } = await setup();

				const json = await adapter.getFileAsJson(testingLib, testFile.name);
				expect(json).toEqual(JSON.parse(testFile.content));
			});

			it('should return file as string', async () => {
				const { testingLib, testFile } = await setup();

				const fileContent = await adapter.getFileAsString(testingLib, testFile.name);
				expect(fileContent).toEqual(testFile.content);
			});

			it('should return file as stream', async () => {
				const { testingLib, testFile } = await setup();

				const fileStream = await adapter.getFileStream(testingLib, testFile.name);

				const streamContents = await new Promise((resolve, reject) => {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const chunks: any[] = [];
					fileStream.on('data', (chunk) => chunks.push(chunk));
					fileStream.on('error', reject);
					fileStream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
				});

				expect(streamContents).toEqual(testFile.content);
			});
		});
		describe('when getting file stats', () => {
			it('should return parsed json', async () => {
				const { testingLib, testFile } = await setup();

				const stats = await adapter.getFileStats(testingLib, testFile.name);

				expect(stats).toMatchObject({
					size: expect.any(Number),
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					birthtime: expect.any(Object), // expect.any(Date) behaves incorrectly
				});
			});

			it("should fail if file doesn't exist", async () => {
				const { testingLib, testFile } = await setup(false);

				const getStats = adapter.getFileStats(testingLib, testFile.name);
				await expect(getStats).rejects.toThrowError('The requested file does not exist');
			});
		});
	});

	describe('when getting languages', () => {
		const setup = async () => {
			const {
				names: { testingLib },
			} = createTestData();

			await adapter.addLibrary(testingLib, false);

			const languages = ['en', 'de'];

			await Promise.all(
				languages.map((language) => adapter.addFile(testingLib, `language/${language}.json`, Readable.from('')))
			);

			return { testingLib, languages };
		};

		it('should return a list of languages', async () => {
			const { testingLib, languages } = await setup();

			const supportedLanguages = await adapter.getLanguages(testingLib);
			expect(supportedLanguages).toEqual(expect.arrayContaining(languages));
		});
	});
});
