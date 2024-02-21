import { Readable } from 'stream';

import { HeadObjectCommandOutput, ServiceOutputTypes } from '@aws-sdk/client-s3';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { H5pError, ILibraryMetadata, ILibraryName } from '@lumieducation/h5p-server';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { S3ClientAdapter } from '@infra/s3-client';
import { FileMetadata, InstalledLibrary } from '../entity/library.entity';
import { H5P_LIBRARIES_S3_CONNECTION } from '../h5p-editor.config';
import { LibraryRepo } from '../repo/library.repo';
import { LibraryStorage } from './libraryStorage.service';

async function readStream(stream: Readable): Promise<string> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const chunks: any[] = [];
	return new Promise((resolve, reject) => {
		stream.on('data', (chunk) => chunks.push(chunk));
		stream.on('error', reject);
		stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
	});
}

jest.useFakeTimers();
describe('LibraryStorage', () => {
	let module: TestingModule;
	let storage: LibraryStorage;
	let s3ClientAdapter: DeepMocked<S3ClientAdapter>;
	let repo: DeepMocked<LibraryRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				LibraryStorage,
				{
					provide: LibraryRepo,
					useValue: createMock<LibraryRepo>(),
				},
				{ provide: H5P_LIBRARIES_S3_CONNECTION, useValue: createMock<S3ClientAdapter>() },
			],
		}).compile();

		storage = module.get(LibraryStorage);
		s3ClientAdapter = module.get(H5P_LIBRARIES_S3_CONNECTION);
		repo = module.get(LibraryRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();

		const installedLibs: InstalledLibrary[] = [];

		repo.getAll.mockImplementation(() => {
			const libs: InstalledLibrary[] = [];
			for (const lib of installedLibs) {
				libs.push(lib);
			}
			return Promise.resolve(libs);
		});

		repo.findByName.mockImplementation((machineName) => {
			const libs: InstalledLibrary[] = [];
			for (const lib of installedLibs) {
				if (lib.machineName === machineName) {
					libs.push(lib);
				}
			}
			return Promise.resolve(libs);
		});

		repo.findByNameAndExactVersion.mockImplementation((machName, major, minor, patch) => {
			for (const lib of installedLibs) {
				if (
					lib.machineName === machName &&
					lib.majorVersion === major &&
					lib.minorVersion === minor &&
					lib.patchVersion === patch
				) {
					return Promise.resolve(lib);
				}
			}
			return Promise.resolve(null);
		});

		repo.findNewestByNameAndVersion.mockImplementation((machName, major, minor) => {
			let latest: InstalledLibrary | null = null;
			for (const lib of installedLibs) {
				if (
					lib.machineName === machName &&
					lib.majorVersion === major &&
					lib.minorVersion === minor &&
					(latest === null || lib.patchVersion > latest.patchVersion)
				) {
					latest = lib;
				}
			}
			return Promise.resolve(latest);
		});

		repo.findOneByNameAndVersionOrFail.mockImplementation((machName, major, minor) => {
			const libs: InstalledLibrary[] = [];
			for (const lib of installedLibs) {
				if (lib.machineName === machName && lib.majorVersion === major && lib.minorVersion === minor) {
					libs.push(lib);
				}
			}
			if (libs.length === 1) {
				return Promise.resolve(libs[0]);
			}
			if (libs.length === 0) {
				throw new Error('Library not found');
			}
			throw new Error('Multiple libraries with the same name and version found');
		});

		repo.createLibrary.mockImplementation((lib) => {
			installedLibs.push(lib);
			return Promise.resolve();
		});

		repo.save.mockImplementation((lib) => {
			if ('concat' in lib) {
				throw Error('Expected InstalledLibrary, not InstalledLibrary[]');
			}
			if (installedLibs.indexOf(lib) === -1) {
				installedLibs.push(lib);
			}
			return Promise.resolve();
		});

		repo.delete.mockImplementation((lib) => {
			const index = installedLibs.indexOf(lib as InstalledLibrary);
			if (index > -1) {
				installedLibs.splice(index, 1);
			} else {
				throw new Error('Library not found');
			}
			return Promise.resolve();
		});

		const savedFiles: [string, string][] = [];

		s3ClientAdapter.create.mockImplementation(async (filepath, dto) => {
			const content = await readStream(dto.data);
			savedFiles.push([filepath, content]);
			return Promise.resolve({} as ServiceOutputTypes);
		});

		s3ClientAdapter.head.mockImplementation((filepath) => {
			for (const file of savedFiles) {
				if (file[0] === filepath) {
					return Promise.resolve({ contentLength: file[1].length } as unknown as HeadObjectCommandOutput);
				}
			}
			throw new Error(`S3 object under ${filepath} not found`);
		});

		s3ClientAdapter.get.mockImplementation((filepath) => {
			for (const file of savedFiles) {
				if (file[0] === filepath) {
					return Promise.resolve({
						name: file[1],
						contentLength: file[1].length,
						data: Readable.from(Buffer.from(file[1])),
					});
				}
			}
			throw new Error(`S3 object under ${filepath} not found`);
		});
	});

	const createTestData = () => {
		const metadataToName = ({ machineName, majorVersion, minorVersion }: ILibraryMetadata): ILibraryName => {
			return {
				machineName,
				majorVersion,
				minorVersion,
			};
		};
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
		const addonLib = new InstalledLibrary(addonLibMetadata);
		addonLib.addTo = { player: { machineNames: [testingLib.machineName] } };

		const circularALibMetadata: ILibraryMetadata = {
			runnable: false,
			title: '',
			patchVersion: 3,
			machineName: 'circular_a',
			majorVersion: 1,
			minorVersion: 2,
		};
		const circularA = new InstalledLibrary(circularALibMetadata);
		const circularBLibMetadata: ILibraryMetadata = {
			runnable: false,
			title: '',
			patchVersion: 3,
			machineName: 'circular_b',
			majorVersion: 1,
			minorVersion: 2,
		};
		const circularB = new InstalledLibrary(circularBLibMetadata);
		circularA.preloadedDependencies = [metadataToName(circularB)];
		circularB.editorDependencies = [metadataToName(circularA)];

		const fakeLibraryName: ILibraryName = { machineName: 'fake', majorVersion: 2, minorVersion: 3 };

		const testingLibDependentAMetadata: ILibraryMetadata = {
			runnable: false,
			title: '',
			patchVersion: 6,
			machineName: 'first_dependent',
			majorVersion: 2,
			minorVersion: 5,
		};
		const testingLibDependentA = new InstalledLibrary(testingLibDependentAMetadata);
		testingLibDependentA.dynamicDependencies = [metadataToName(testingLib)];

		const testingLibDependentBMetadata: ILibraryMetadata = {
			runnable: false,
			title: '',
			patchVersion: 6,
			machineName: 'second_dependent',
			majorVersion: 2,
			minorVersion: 5,
		};
		const testingLibDependentB = new InstalledLibrary(testingLibDependentBMetadata);
		testingLibDependentB.preloadedDependencies = [metadataToName(testingLib)];

		const libWithNonExistingDependencyMetadata: ILibraryMetadata = {
			runnable: false,
			title: '',
			patchVersion: 6,
			machineName: 'fake_dependency',
			majorVersion: 2,
			minorVersion: 5,
		};
		const libWithNonExistingDependency = new InstalledLibrary(libWithNonExistingDependencyMetadata);
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

	it('should be defined', () => {
		expect(storage).toBeDefined();
	});

	describe('when managing library metadata', () => {
		const setup = async (addLibrary = true) => {
			const {
				names: { testingLib },
			} = createTestData();

			if (addLibrary) {
				await storage.addLibrary(testingLib, false);
			}

			return { testingLib };
		};

		describe('when adding library', () => {
			it('should succeed', async () => {
				await setup();

				expect(repo.createLibrary).toHaveBeenCalled();
			});

			it('should fail to override existing library', async () => {
				const { testingLib } = await setup();

				repo.findByNameAndExactVersion.mockResolvedValue(testingLib);

				const addLib = storage.addLibrary(testingLib, false);
				await expect(addLib).rejects.toThrowError("Can't add library because it already exists");
			});
		});

		describe('when getting metadata', () => {
			it('should succeed if library exists', async () => {
				const { testingLib } = await setup();

				repo.findOneByNameAndVersionOrFail.mockResolvedValue(testingLib);

				const returnedLibrary = await storage.getLibrary(testingLib);
				expect(returnedLibrary).toEqual(expect.objectContaining(testingLib));
			});

			it("should fail if library doesn't exist", async () => {
				const { testingLib } = await setup(false);

				repo.findOneByNameAndVersionOrFail.mockImplementation(() => {
					throw new Error('Library does not exist');
				});

				const getLibrary = storage.getLibrary(testingLib);
				await expect(getLibrary).rejects.toThrowError();
			});
		});

		describe('when checking installed status', () => {
			it('should return true if library is installed', async () => {
				const { testingLib } = await setup();

				repo.findNewestByNameAndVersion.mockResolvedValue(testingLib);

				const installed = await storage.isInstalled(testingLib);
				expect(installed).toBe(true);
			});

			it("should return false if library isn't installed", async () => {
				const { testingLib } = await setup(false);

				repo.findNewestByNameAndVersion.mockResolvedValue(null);

				const installed = await storage.isInstalled(testingLib);
				expect(installed).toBe(false);
			});
		});

		describe('when updating metadata', () => {
			it('should update metadata', async () => {
				const { testingLib } = await setup();

				const libFromDatabaseMetadata: ILibraryMetadata = {
					runnable: false,
					title: '',
					patchVersion: testingLib.patchVersion,
					machineName: testingLib.machineName,
					majorVersion: testingLib.majorVersion,
					minorVersion: testingLib.minorVersion,
				};
				const libFromDatabase = new InstalledLibrary(libFromDatabaseMetadata);

				repo.findOneByNameAndVersionOrFail.mockResolvedValue(libFromDatabase);

				testingLib.author = 'Test Author';
				const updatedLibrary = await storage.updateLibrary(testingLib);
				const retrievedLibrary = await storage.getLibrary(testingLib);
				expect(retrievedLibrary).toEqual(updatedLibrary);
				expect(repo.save).toHaveBeenCalled();
			});

			it("should fail if library doesn't exist", async () => {
				const { testingLib } = await setup(false);

				repo.findOneByNameAndVersionOrFail.mockImplementation(() => {
					throw new Error('Library is not installed');
				});

				const updateLibrary = storage.updateLibrary(testingLib);
				await expect(updateLibrary).rejects.toThrowError('Library is not installed');
			});
		});

		describe('when updating additional metadata', () => {
			it('should return true if data has changed', async () => {
				const { testingLib } = await setup();

				repo.findOneByNameAndVersionOrFail.mockResolvedValue(testingLib);

				const updated = await storage.updateAdditionalMetadata(testingLib, { restricted: true });
				expect(updated).toBe(true);
			});

			it("should return false if data hasn't changed", async () => {
				const { testingLib } = await setup();

				repo.findOneByNameAndVersionOrFail.mockResolvedValue(testingLib);

				const updated = await storage.updateAdditionalMetadata(testingLib, { restricted: false });
				expect(updated).toBe(false);
			});

			it('should fail if data could not be updated', async () => {
				const { testingLib } = await setup();

				repo.findOneByNameAndVersionOrFail.mockResolvedValue(testingLib);
				repo.save.mockImplementation(() => {
					throw new Error('Library could not be saved');
				});

				const updateMetadata = storage.updateAdditionalMetadata(testingLib, { restricted: true });
				await expect(updateMetadata).rejects.toThrowError();
			});
		});

		describe('when deleting library', () => {
			it('should succeed if library exists', async () => {
				const { testingLib } = await setup();

				repo.findOneByNameAndVersionOrFail.mockResolvedValue(testingLib);
				repo.delete.mockImplementation(() => {
					repo.findOneByNameAndVersionOrFail.mockImplementation(() => {
						throw new Error('Library is not installed');
					});
					return Promise.resolve();
				});

				// @ts-expect-error test case
				s3ClientAdapter.list.mockResolvedValueOnce({ files: [] });

				await storage.deleteLibrary(testingLib);
				await expect(storage.getLibrary(testingLib)).rejects.toThrow();
				expect(s3ClientAdapter.delete).toHaveBeenCalled();
			});

			it("should fail if library doesn't exists", async () => {
				const { testingLib } = await setup(false);

				repo.findOneByNameAndVersionOrFail.mockImplementation(() => {
					throw new Error('Library is not installed');
				});

				const deleteLibrary = storage.deleteLibrary(testingLib);
				await expect(deleteLibrary).rejects.toThrowError();
			});
		});
	});

	describe('getLibraryFile', () => {
		describe('when getting library.json file', () => {
			const setup = async (addLibrary = true) => {
				const {
					names: { testingLib },
				} = createTestData();

				if (addLibrary) {
					await storage.addLibrary(testingLib, false);
				}
				const ubername = 'testing-1.2';
				const file = 'library.json';

				return { testingLib, file, ubername };
			};

			it('should return library.json file', async () => {
				const { testingLib, file, ubername } = await setup();
				repo.findOneByNameAndVersionOrFail.mockResolvedValueOnce(testingLib);

				const result = await storage.getLibraryFile(ubername, file);

				expect(result).toBeDefined();
				expect(result.mimetype).toBeDefined();
				expect(result.mimetype).toEqual('application/json');
			});
		});
	});

	describe('When getting library dependencies', () => {
		const setup = async () => {
			const { libraries, names } = createTestData();

			for await (const library of libraries) {
				await storage.addLibrary(library, false);
			}

			return names;
		};

		it('should find addon libraries', async () => {
			const { addonLib } = await setup();

			const addons = await storage.listAddons();
			expect(addons).toEqual([addonLib]);
		});

		it('should count dependencies', async () => {
			await setup();

			const dependencies = await storage.getAllDependentsCount();
			expect(dependencies).toEqual({ 'circular_a-1.2': 1, 'testing-1.2': 2, 'fake-2.3': 1 });
		});

		it('should count dependents for single library', async () => {
			const { testingLib } = await setup();

			const count = await storage.getDependentsCount(testingLib);
			expect(count).toBe(2);
		});

		it('should count dependencies for library without dependents', async () => {
			const { addonLib } = await setup();

			const count = await storage.getDependentsCount(addonLib);
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
				await storage.addLibrary(library, false);
			}

			return { libraries, testingLib };
		};

		it('should return all libraries when no filter is used', async () => {
			const { libraries } = await setup();

			const allLibraries = await storage.getInstalledLibraryNames();
			expect(allLibraries.length).toBe(libraries.length);
		});

		it('should return all libraries with machinename', async () => {
			const { testingLib } = await setup();

			const allLibraries = await storage.getInstalledLibraryNames(testingLib.machineName);
			expect(allLibraries.length).toBe(1);
		});
	});

	describe('when managing files', () => {
		const setup = async (addLib = true, addFiles = true) => {
			const {
				names: { testingLib },
			} = createTestData();

			const testFile = {
				name: 'test/abc.json',
				content: JSON.stringify({ property: 'value' }),
			};

			if (addLib) {
				await storage.addLibrary(testingLib, false);
			}

			if (addFiles) {
				await storage.addFile(testingLib, testFile.name, Readable.from(Buffer.from(testFile.content)));
			}

			return { testingLib, testFile };
		};

		describe('when adding files', () => {
			it('should work', async () => {
				await setup();
			});

			it('should fail on illegal filename', async () => {
				const { testingLib } = await setup();

				const filenames = ['../abc.json', '/test/abc.json'];

				await Promise.all(
					filenames.map((filename) => {
						const addFile = () => storage.addFile(testingLib, filename, Readable.from(Buffer.from('')));
						return expect(addFile).rejects.toThrow('illegal-filename');
					})
				);
			});

			describe('when s3 upload error', () => {
				it('should throw H5P Error', async () => {
					const { testingLib } = await setup();
					const filename = 'test/abc.json';

					s3ClientAdapter.create.mockImplementationOnce(() => {
						throw Error('S3 Exception');
					});

					const addFile = () => storage.addFile(testingLib, filename, Readable.from(Buffer.from('')));
					return expect(addFile).rejects.toThrow(
						new H5pError(`mongo-s3-library-storage:s3-upload-error (ubername: testing-1.2, filename: test/abc.json)`)
					);
				});
			});
		});

		it('should list all files', async () => {
			const { testingLib, testFile } = await setup();

			// @ts-expect-error test
			s3ClientAdapter.list.mockResolvedValueOnce({ files: [testFile.name] });

			const files = await storage.listFiles(testingLib);
			expect(files).toContainEqual(expect.stringContaining(testFile.name));
		});

		describe('when checking if file exists', () => {
			it('should return true if it exists', async () => {
				const { testingLib, testFile } = await setup();

				const exists = await storage.fileExists(testingLib, testFile.name);
				expect(exists).toBe(true);
			});

			it("should return false if it doesn't exist", async () => {
				const { testingLib, testFile } = await setup(true, false);

				const exists = await storage.fileExists(testingLib, testFile.name);
				expect(exists).toBe(false);
			});
		});

		describe('when clearing files', () => {
			it('should remove all files', async () => {
				const { testingLib, testFile } = await setup();

				// @ts-expect-error test
				s3ClientAdapter.list.mockResolvedValueOnce({ files: [testFile.name] });

				await storage.clearFiles(testingLib);

				expect(s3ClientAdapter.delete).toHaveBeenCalledWith([expect.stringContaining(testFile.name)]);
			});

			it("should fail if library doesn't exist", async () => {
				const { testingLib } = await setup(false, false);

				const clearFiles = () => storage.clearFiles(testingLib);
				await expect(clearFiles).rejects.toThrow('mongo-s3-library-storage:clear-library-not-found');
			});
		});

		describe('when retrieving files', () => {
			it('should return parsed json', async () => {
				const { testingLib, testFile } = await setup();

				const json = await storage.getFileAsJson(testingLib, testFile.name);
				expect(json).toEqual(JSON.parse(testFile.content));
			});

			it('should return file as string', async () => {
				const { testingLib, testFile } = await setup();

				const fileContent = await storage.getFileAsString(testingLib, testFile.name);
				expect(fileContent).toEqual(testFile.content);
			});

			it('should return file as stream', async () => {
				const { testingLib, testFile } = await setup();

				const fileStream = await storage.getFileStream(testingLib, testFile.name);

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
			it('should return file stats', async () => {
				const { testingLib, testFile } = await setup();

				const mockStats = {
					LastModified: new Date(),
					ContentLength: 15,
				};

				// @ts-expect-error partial mock
				s3ClientAdapter.head.mockResolvedValueOnce(mockStats);

				const stats = await storage.getFileStats(testingLib, testFile.name);

				expect(stats).toMatchObject({
					size: mockStats.ContentLength,
					birthtime: mockStats.LastModified,
				});
			});

			it('should fail if filename is invalid', async () => {
				const { testingLib } = await setup(true, false);

				const getStats = storage.getFileStats(testingLib, '../invalid');
				await expect(getStats).rejects.toThrowError('illegal-filename');
			});

			it('should throw NotFoundException if the file has no content-length or birthtime', async () => {
				const { testingLib, testFile } = await setup();

				s3ClientAdapter.head
					// @ts-expect-error partial mock
					.mockResolvedValueOnce({
						LastModified: new Date(),
					})
					// @ts-expect-error partial mock
					.mockResolvedValueOnce({
						ContentLength: 10,
					});

				const undefinedLength = storage.getFileStats(testingLib, testFile.name);
				await expect(undefinedLength).rejects.toThrowError(NotFoundException);

				const undefinedBirthtime = storage.getFileStats(testingLib, testFile.name);
				await expect(undefinedBirthtime).rejects.toThrow(NotFoundException);
			});
		});
	});

	describe('when getting languages', () => {
		const setup = async () => {
			const {
				names: { testingLib },
			} = createTestData();

			await storage.addLibrary(testingLib, false);

			const languageFiles = ['en.json', 'de.json'];
			const languages = ['en', 'de'];
			// @ts-expect-error test
			s3ClientAdapter.list.mockResolvedValueOnce({ files: languageFiles });

			return { testingLib, languages };
		};

		it('should return a list of languages', async () => {
			const { testingLib, languages } = await setup();

			const supportedLanguages = await storage.getLanguages(testingLib);
			expect(supportedLanguages).toEqual(expect.arrayContaining(languages));
		});
	});
});
