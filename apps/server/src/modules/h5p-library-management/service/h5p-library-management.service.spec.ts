import { Logger } from '@core/logger';
import { createMock } from '@golevelup/ts-jest';
import {
	IHubContentType,
	ILibraryAdministrationOverviewItem,
	ILibraryInstallResult,
} from '@lumieducation/h5p-server/build/src/types';
import { ObjectId } from '@mikro-orm/mongodb';
import { ContentStorage, LibraryStorage } from '@modules/h5p-editor';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ILibraryAdministrationOverviewItemTestFactory, ILibraryInstallResultTestFactory } from '../testing';
import { IH5PLibraryManagementConfig } from './h5p-library-management.config';
import { H5PLibraryManagementService, castToLibrariesContentType } from './h5p-library-management.service';

describe('H5PLibraryManagementService', () => {
	let module: TestingModule;
	let libraryStorage: jest.Mocked<LibraryStorage>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				H5PLibraryManagementService,
				{
					provide: LibraryStorage,
					useValue: createMock<LibraryStorage>(),
				},
				{
					provide: ContentStorage,
					useValue: createMock<ContentStorage>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<IH5PLibraryManagementConfig, true>>({
						get: () => 'config/h5p-libraries.yaml',
					}),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		libraryStorage = module.get(LibraryStorage);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('castToLibrariesContentType', () => {
		describe('when castToLibrariesContentType has been called successfully', () => {
			it('should throw InternalServerErrorException', () => {
				const randomObject = {
					random: 1,
				};
				expect(() => castToLibrariesContentType(randomObject)).toThrow(InternalServerErrorException);
			});
		});
	});

	describe('run', () => {
		describe('when run has been called successfully', () => {
			const setup = () => {
				const uninstalledLibraries = [
					ILibraryAdministrationOverviewItemTestFactory.create({ machineName: 'a', dependentsCount: 0, title: 'a' }),
					ILibraryAdministrationOverviewItemTestFactory.create({ machineName: 'b', dependentsCount: 1, title: 'b' }),
					ILibraryAdministrationOverviewItemTestFactory.create({ machineName: 'c', dependentsCount: 0, title: 'c' }),
				];
				const installedLibraries = [
					ILibraryInstallResultTestFactory.create('new', {
						machineName: 'd',
						majorVersion: 1,
						minorVersion: 1,
						patchVersion: 1,
					}),
					ILibraryInstallResultTestFactory.create(
						'patch',
						{ machineName: 'e', majorVersion: 1, minorVersion: 1, patchVersion: 1 },
						{ machineName: 'e', majorVersion: 2, minorVersion: 2, patchVersion: 2 }
					),
					ILibraryInstallResultTestFactory.create('none'),
				];
				const synchronizedLibraries: ILibraryInstallResult[] = [];
				const service = module.get(H5PLibraryManagementService);

				return { installedLibraries, service, synchronizedLibraries, uninstalledLibraries };
			};
			it('should uninstall unwanted libraries, install new libraries and synchronize libraries', async () => {
				const { installedLibraries, service, synchronizedLibraries, uninstalledLibraries } = setup();

				const uninstallSpy = jest
					.spyOn(service, 'uninstallUnwantedLibrariesAsBulk')
					.mockResolvedValueOnce(uninstalledLibraries);
				const installSpy = jest.spyOn(service, 'installLibrariesAsBulk').mockResolvedValueOnce(installedLibraries);
				const synchronizeSpy = jest
					.spyOn(service, 'synchronizeDbEntryAndLibraryJson')
					.mockResolvedValueOnce(synchronizedLibraries);

				await service.run();

				expect(uninstallSpy).toHaveBeenCalledTimes(1);
				expect(installSpy).toHaveBeenCalledTimes(1);
				expect(synchronizeSpy).toHaveBeenCalledTimes(1);

				uninstallSpy.mockRestore();
				installSpy.mockRestore();
				synchronizeSpy.mockRestore();
			});
		});
	});

	describe('uninstallUnwantedLibraries', () => {
		describe('when libraries are uninstalled successfully', () => {
			const setup = () => {
				const service = module.get(H5PLibraryManagementService);

				const wantedLibraries = ['a', 'b'];
				let availableLibraries = [
					ILibraryAdministrationOverviewItemTestFactory.create({
						machineName: 'a',
						dependentsCount: 1,
						title: 'Library A',
					}),
					ILibraryAdministrationOverviewItemTestFactory.create({
						machineName: 'b',
						dependentsCount: 0,
						title: 'Library B',
					}),
					ILibraryAdministrationOverviewItemTestFactory.create({
						machineName: 'c',
						dependentsCount: 0,
						title: 'Library C',
					}),
				];

				const expectedUninstalled = [
					ILibraryAdministrationOverviewItemTestFactory.create({
						machineName: 'c',
						dependentsCount: 0,
						title: 'Library C',
					}),
				];

				jest.spyOn(service.libraryAdministration, 'getLibraries').mockResolvedValue(availableLibraries);

				libraryStorage.deleteLibrary.mockImplementationOnce((lib) => {
					const index = availableLibraries.findIndex((item) => item.machineName === lib.machineName);
					if (index !== -1) {
						availableLibraries = availableLibraries.splice(index, 1);
					}

					return Promise.resolve();
				});

				service.libraryWishList = wantedLibraries;

				return { service, wantedLibraries, expectedUninstalled };
			};

			it('should uninstall unwanted libraries and return the list of uninstalled libraries', async () => {
				const { service, expectedUninstalled } = setup();

				// Call the method to uninstall unwanted libraries
				// This will use the mocked getLibraries and deleteLibrary methods

				const uninstalledLibraries = await service.uninstallUnwantedLibrariesAsBulk();

				expect(uninstalledLibraries).toEqual(expectedUninstalled);
			});
		});

		describe('when deleteLibrary fails', () => {
			const setup = () => {
				const service = module.get(H5PLibraryManagementService);

				const wantedLibraries = ['a'];
				let availableLibraries = [
					ILibraryAdministrationOverviewItemTestFactory.create({
						machineName: 'a',
						dependentsCount: 1,
						title: 'Library A',
					}),
					ILibraryAdministrationOverviewItemTestFactory.create({
						machineName: 'b',
						dependentsCount: 0,
						title: 'Library B',
					}),
					ILibraryAdministrationOverviewItemTestFactory.create({
						machineName: 'c',
						dependentsCount: 0,
						title: 'Library C',
					}),
				];

				const expectedUninstalled = [
					ILibraryAdministrationOverviewItemTestFactory.create({
						machineName: 'c',
						dependentsCount: 0,
						title: 'Library C',
					}),
				];

				jest.spyOn(service.libraryAdministration, 'getLibraries').mockResolvedValue(availableLibraries);

				libraryStorage.deleteLibrary
					.mockRejectedValueOnce(new Error('Mocked error during library deletion'))
					.mockImplementationOnce((lib) => {
						const index = availableLibraries.findIndex((item) => item.machineName === lib.machineName);
						if (index !== -1) {
							availableLibraries = availableLibraries.splice(index, 1);
						}

						return Promise.resolve();
					});

				service.libraryWishList = wantedLibraries;

				return { service, wantedLibraries, expectedUninstalled };
			};

			it('should uninstall unwanted libraries except the failed library and return the list of uninstalled libraries', async () => {
				const { service, expectedUninstalled } = setup();

				// Call the method to uninstall unwanted libraries
				// This will use the mocked getLibraries and deleteLibrary methods

				const uninstalledLibraries = await service.uninstallUnwantedLibrariesAsBulk();

				expect(uninstalledLibraries).toEqual(expectedUninstalled);
			});
		});

		describe('when no libraries need to be uninstalled', () => {
			const setup = () => {
				const service = module.get(H5PLibraryManagementService);

				const wantedLibraries = ['a', 'b'];
				const librariesToCheck = [
					{
						machineName: 'a',
						dependentsCount: 0,
						canBeDeleted: true,
						canBeUpdated: true,
						instancesAsDependencyCount: 0,
						instancesCount: 0,
						isAddon: false,
						majorVersion: 1,
						minorVersion: 0,
						patchVersion: 0,
						restricted: false,
						runnable: true,
						title: 'Library A',
					},
				];

				jest.spyOn(service.libraryAdministration, 'getLibraries').mockResolvedValue(librariesToCheck);

				service.libraryWishList = wantedLibraries;

				return { service };
			};

			it('should return an empty list', async () => {
				const { service } = setup();

				const uninstalledLibraries = await service.uninstallUnwantedLibrariesAsBulk();

				expect(uninstalledLibraries).toEqual([]);
			});
		});
	});

	describe('installLibraries', () => {
		describe('when libraries exist', () => {
			const setup = () => {
				const service = module.get(H5PLibraryManagementService);

				const wantedLibraries = ['a', 'b', 'c'];
				const availableLibraries: ILibraryAdministrationOverviewItem[] = [
					ILibraryAdministrationOverviewItemTestFactory.create({
						machineName: 'd',
						dependentsCount: 0,
						title: 'Library D',
					}),
					ILibraryAdministrationOverviewItemTestFactory.create({
						machineName: 'e',
						dependentsCount: 0,
						title: 'Library E',
					}),
					ILibraryAdministrationOverviewItemTestFactory.create({
						machineName: 'f',
						dependentsCount: 0,
						title: 'Library F',
					}),
				];

				service.libraryWishList = wantedLibraries;

				jest
					.spyOn(service.contentTypeRepo, 'installContentType')
					.mockResolvedValueOnce([
						ILibraryInstallResultTestFactory.create('new', {
							machineName: 'libraryA',
							majorVersion: 1,
							minorVersion: 0,
							patchVersion: 0,
						}),
					])
					.mockResolvedValueOnce([
						ILibraryInstallResultTestFactory.create(
							'patch',
							{
								machineName: 'libraryB',
								majorVersion: 1,
								minorVersion: 0,
								patchVersion: 0,
							},
							{
								machineName: 'libraryB',
								majorVersion: 1,
								minorVersion: 0,
								patchVersion: 1,
							}
						),
					])
					.mockResolvedValueOnce([ILibraryInstallResultTestFactory.create('none')]);
				jest.spyOn(service.contentTypeCache, 'get').mockResolvedValue([]);

				return { availableLibraries, service };
			};

			it('should install all libraries in the list', async () => {
				const { availableLibraries, service } = setup();

				const installedLibraries = await service.installLibrariesAsBulk(availableLibraries);

				expect(installedLibraries).toEqual([
					{
						newVersion: {
							machineName: 'libraryA',
							majorVersion: 1,
							minorVersion: 0,
							patchVersion: 0,
						},
						oldVersion: undefined,
						type: 'new',
					},
					{
						newVersion: {
							machineName: 'libraryB',
							majorVersion: 1,
							minorVersion: 0,
							patchVersion: 0,
						},
						oldVersion: {
							machineName: 'libraryB',
							majorVersion: 1,
							minorVersion: 0,
							patchVersion: 1,
						},
						type: 'patch',
					},
					{
						newVersion: undefined,
						oldVersion: undefined,
						type: 'none',
					},
				]);
			});
		});

		describe('when library does not exist', () => {
			const setup = () => {
				const service = module.get(H5PLibraryManagementService);

				const nonExistentLibrary = 'nonExistentLibrary';
				const availableLibraries: ILibraryAdministrationOverviewItem[] = [];

				service.libraryWishList = [nonExistentLibrary];

				jest.spyOn(service.contentTypeRepo, 'installContentType');
				jest
					.spyOn(service.contentTypeCache, 'get')
					.mockResolvedValueOnce(undefined as unknown as Promise<IHubContentType[]>);

				return { availableLibraries, service };
			};

			it('should not install library', async () => {
				const { availableLibraries, service } = setup();

				const availableLLibraries = await service.installLibrariesAsBulk(availableLibraries);

				expect(availableLLibraries).toEqual([]);
			});
		});

		describe('when contentTypeRepo.installContentType rejects with an error', () => {
			const setup = () => {
				const service = module.get(H5PLibraryManagementService);

				const library = 'mock-library';
				const error = new Error('Mock installation error');

				jest.spyOn(service.contentTypeCache, 'get').mockResolvedValueOnce([]);
				jest.spyOn(service.contentTypeRepo, 'installContentType').mockRejectedValueOnce(error);

				const availableLibraries: ILibraryAdministrationOverviewItem[] = [];

				service.libraryWishList = [library];

				return { availableLibraries, service };
			};

			it('should return an empty result list', async () => {
				const { availableLibraries, service } = setup();

				const availableLLibraries = await service.installLibrariesAsBulk(availableLibraries);

				expect(availableLLibraries).toEqual([]);
			});
		});
	});

	describe('synchronizeDbEntryAndLibraryJson', () => {
		describe('updateLibrary', () => {
			describe('when a new version of an existing library is available on S3', () => {
				const setup = () => {
					const service = module.get(H5PLibraryManagementService);

					libraryStorage.getAllLibraryFolders.mockResolvedValueOnce(['libraryA-1.0']);
					libraryStorage.fileExists.mockResolvedValueOnce(true);
					libraryStorage.getFileAsJson.mockResolvedValueOnce({
						machineName: 'libraryA',
						majorVersion: 1,
						minorVersion: 0,
						patchVersion: 1,
					});
					libraryStorage.isInstalled.mockResolvedValueOnce(true);
					libraryStorage.getInstalledLibraryNames.mockResolvedValueOnce([
						{
							machineName: 'libraryA',
							majorVersion: 1,
							minorVersion: 0,
						},
					]);
					libraryStorage.getLibrary.mockResolvedValueOnce({
						machineName: 'libraryA',
						majorVersion: 1,
						minorVersion: 0,
						patchVersion: 0,
						files: [],
						_id: new ObjectId(),
						id: 'mock_id',
						createdAt: new Date(),
						updatedAt: new Date(),
						restricted: false,
						runnable: true,
						title: 'Library A',
						compare: jest.fn(),
						compareVersions: jest.fn(),
					});
					libraryStorage.updateLibrary.mockResolvedValueOnce({
						machineName: 'libraryA',
						majorVersion: 1,
						minorVersion: 0,
						patchVersion: 1,
						restricted: false,
						runnable: true,
						title: 'Library A',
						compare: jest.fn(),
						compareVersions: jest.fn(),
					});
					libraryStorage.isInstalled.mockResolvedValueOnce(true);
					libraryStorage.getLibrary.mockResolvedValueOnce({
						machineName: 'libraryA',
						majorVersion: 1,
						minorVersion: 0,
						patchVersion: 1,
						files: [],
						_id: new ObjectId(),
						id: 'mock_id',
						createdAt: new Date(),
						updatedAt: new Date(),
						restricted: false,
						runnable: true,
						title: 'Library A',
						compare: jest.fn(),
						compareVersions: jest.fn(),
						preloadedJs: [{ path: 'path/to/preloaded.js' }],
						preloadedCss: [{ path: 'path/to/preloaded.css' }],
					});
					libraryStorage.fileExists.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

					return { service };
				};

				it('should update the library in the database', async () => {
					const { service } = setup();

					const synchronizedLibraries = await service.synchronizeDbEntryAndLibraryJson();

					expect(synchronizedLibraries).toEqual([
						{
							newVersion: {
								machineName: 'libraryA',
								majorVersion: 1,
								minorVersion: 0,
								patchVersion: 1,
							},
							oldVersion: {
								machineName: 'libraryA',
								majorVersion: 1,
								minorVersion: 0,
								patchVersion: 0,
							},
							type: 'patch',
						},
					]);
				});
			});

			describe('when no library update is available', () => {
				const setup = () => {
					const service = module.get(H5PLibraryManagementService);

					libraryStorage.getAllLibraryFolders.mockResolvedValueOnce(['libraryA-1.0']);
					libraryStorage.fileExists.mockResolvedValueOnce(true);
					libraryStorage.getFileAsJson.mockResolvedValueOnce({
						machineName: 'libraryA',
						majorVersion: 1,
						minorVersion: 0,
						patchVersion: 0,
					});
					libraryStorage.isInstalled.mockResolvedValueOnce(true);
					libraryStorage.getInstalledLibraryNames.mockResolvedValueOnce([
						{
							machineName: 'libraryA',
							majorVersion: 1,
							minorVersion: 0,
						},
					]);
					libraryStorage.getLibrary.mockResolvedValueOnce({
						machineName: 'libraryA',
						majorVersion: 1,
						minorVersion: 0,
						patchVersion: 0,
						files: [],
						_id: new ObjectId(),
						id: 'mock_id',
						createdAt: new Date(),
						updatedAt: new Date(),
						restricted: false,
						runnable: true,
						title: 'Library A',
						compare: jest.fn(),
						compareVersions: jest.fn(),
					});
					libraryStorage.isInstalled.mockResolvedValueOnce(true);
					libraryStorage.getLibrary.mockResolvedValueOnce({
						machineName: 'libraryA',
						majorVersion: 1,
						minorVersion: 0,
						patchVersion: 0,
						files: [],
						_id: new ObjectId(),
						id: 'mock_id',
						createdAt: new Date(),
						updatedAt: new Date(),
						restricted: false,
						runnable: true,
						title: 'Library A',
						compare: jest.fn(),
						compareVersions: jest.fn(),
						preloadedJs: [{ path: 'path/to/preloaded.js' }],
						preloadedCss: [{ path: 'path/to/preloaded.css' }],
					});
					libraryStorage.fileExists.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

					return { service };
				};

				it('should return an empty result list', async () => {
					const { service } = setup();

					const synchronizedLibraries = await service.synchronizeDbEntryAndLibraryJson();

					expect(synchronizedLibraries).toEqual([]);
				});
			});

			describe('when an error occured in updateLibrary', () => {
				const setup = () => {
					const service = module.get(H5PLibraryManagementService);

					libraryStorage.getAllLibraryFolders.mockResolvedValueOnce(['libraryA-1.0']);
					libraryStorage.fileExists.mockResolvedValueOnce(true);
					libraryStorage.getFileAsJson.mockResolvedValueOnce({
						machineName: 'libraryA',
						majorVersion: 1,
						minorVersion: 0,
						patchVersion: 1,
					});
					libraryStorage.isInstalled.mockResolvedValueOnce(true);
					libraryStorage.getInstalledLibraryNames.mockResolvedValueOnce([
						{
							machineName: 'libraryA',
							majorVersion: 1,
							minorVersion: 0,
						},
					]);
					libraryStorage.getLibrary.mockResolvedValueOnce({
						machineName: 'libraryA',
						majorVersion: 1,
						minorVersion: 0,
						patchVersion: 0,
						files: [],
						_id: new ObjectId(),
						id: 'mock_id',
						createdAt: new Date(),
						updatedAt: new Date(),
						restricted: false,
						runnable: true,
						title: 'Library A',
						compare: jest.fn(),
						compareVersions: jest.fn(),
					});
					libraryStorage.updateLibrary.mockRejectedValueOnce(new Error('Mocked error during library update'));
					libraryStorage.deleteLibrary.mockResolvedValueOnce();

					return { service };
				};

				it('should return an empty result list', async () => {
					const { service } = setup();

					const synchronizedLibraries = await service.synchronizeDbEntryAndLibraryJson();

					expect(synchronizedLibraries).toEqual([]);
				});
			});

			describe('checkConsistency', () => {
				describe('when library is not installed', () => {
					const setup = () => {
						const service = module.get(H5PLibraryManagementService);

						libraryStorage.getAllLibraryFolders.mockResolvedValueOnce(['libraryA-1.0']);
						libraryStorage.fileExists.mockResolvedValueOnce(true);
						libraryStorage.getFileAsJson.mockResolvedValueOnce({
							machineName: 'libraryA',
							majorVersion: 1,
							minorVersion: 0,
							patchVersion: 1,
						});
						libraryStorage.isInstalled.mockResolvedValueOnce(true);
						libraryStorage.getInstalledLibraryNames.mockResolvedValueOnce([
							{
								machineName: 'libraryA',
								majorVersion: 1,
								minorVersion: 0,
							},
						]);
						libraryStorage.getLibrary.mockResolvedValueOnce({
							machineName: 'libraryA',
							majorVersion: 1,
							minorVersion: 0,
							patchVersion: 0,
							files: [],
							_id: new ObjectId(),
							id: 'mock_id',
							createdAt: new Date(),
							updatedAt: new Date(),
							restricted: false,
							runnable: true,
							title: 'Library A',
							compare: jest.fn(),
							compareVersions: jest.fn(),
						});
						libraryStorage.updateLibrary.mockResolvedValueOnce({
							machineName: 'libraryA',
							majorVersion: 1,
							minorVersion: 0,
							patchVersion: 1,
							restricted: false,
							runnable: true,
							title: 'Library A',
							compare: jest.fn(),
							compareVersions: jest.fn(),
						});
						libraryStorage.isInstalled.mockResolvedValueOnce(false);

						return { service };
					};

					it('should return an empty result list', async () => {
						const { service } = setup();

						const synchronizedLibraries = await service.synchronizeDbEntryAndLibraryJson();

						expect(synchronizedLibraries).toEqual([]);
					});
				});

				describe('when getLibrary fails', () => {
					const setup = () => {
						const service = module.get(H5PLibraryManagementService);

						libraryStorage.getAllLibraryFolders.mockResolvedValueOnce(['libraryA-1.0']);
						libraryStorage.fileExists.mockResolvedValueOnce(true);
						libraryStorage.getFileAsJson.mockResolvedValueOnce({
							machineName: 'libraryA',
							majorVersion: 1,
							minorVersion: 0,
							patchVersion: 1,
						});
						libraryStorage.isInstalled.mockResolvedValueOnce(true);
						libraryStorage.getInstalledLibraryNames.mockResolvedValueOnce([
							{
								machineName: 'libraryA',
								majorVersion: 1,
								minorVersion: 0,
							},
						]);
						libraryStorage.getLibrary.mockResolvedValueOnce({
							machineName: 'libraryA',
							majorVersion: 1,
							minorVersion: 0,
							patchVersion: 0,
							files: [],
							_id: new ObjectId(),
							id: 'mock_id',
							createdAt: new Date(),
							updatedAt: new Date(),
							restricted: false,
							runnable: true,
							title: 'Library A',
							compare: jest.fn(),
							compareVersions: jest.fn(),
						});
						libraryStorage.isInstalled.mockResolvedValueOnce(true);
						libraryStorage.getLibrary.mockRejectedValueOnce(new Error('Mocked error during getLibrary'));

						return { service };
					};

					it('should return an empty result list', async () => {
						const { service } = setup();

						const synchronizedLibraries = await service.synchronizeDbEntryAndLibraryJson();

						expect(synchronizedLibraries).toEqual([]);
					});
				});

				describe('when js file does not exist', () => {
					const setup = () => {
						const service = module.get(H5PLibraryManagementService);

						libraryStorage.getAllLibraryFolders.mockResolvedValueOnce(['libraryA-1.0']);
						libraryStorage.fileExists.mockResolvedValueOnce(true);
						libraryStorage.getFileAsJson.mockResolvedValueOnce({
							machineName: 'libraryA',
							majorVersion: 1,
							minorVersion: 0,
							patchVersion: 1,
						});
						libraryStorage.isInstalled.mockResolvedValueOnce(true);
						libraryStorage.getInstalledLibraryNames.mockResolvedValueOnce([
							{
								machineName: 'libraryA',
								majorVersion: 1,
								minorVersion: 0,
							},
						]);
						libraryStorage.getLibrary.mockResolvedValueOnce({
							machineName: 'libraryA',
							majorVersion: 1,
							minorVersion: 0,
							patchVersion: 0,
							files: [],
							_id: new ObjectId(),
							id: 'mock_id',
							createdAt: new Date(),
							updatedAt: new Date(),
							restricted: false,
							runnable: true,
							title: 'Library A',
							compare: jest.fn(),
							compareVersions: jest.fn(),
						});
						libraryStorage.isInstalled.mockResolvedValueOnce(true);
						libraryStorage.getLibrary.mockResolvedValueOnce({
							machineName: 'libraryA',
							majorVersion: 1,
							minorVersion: 0,
							patchVersion: 0,
							files: [],
							_id: new ObjectId(),
							id: 'mock_id',
							createdAt: new Date(),
							updatedAt: new Date(),
							restricted: false,
							runnable: true,
							title: 'Library A',
							compare: jest.fn(),
							compareVersions: jest.fn(),
							preloadedJs: [{ path: 'path/to/preloaded.js' }],
							preloadedCss: [{ path: 'path/to/preloaded.css' }],
						});
						libraryStorage.fileExists.mockResolvedValueOnce(false);

						return { service };
					};

					it('should return an empty result list', async () => {
						const { service } = setup();

						const synchronizedLibraries = await service.synchronizeDbEntryAndLibraryJson();

						expect(synchronizedLibraries).toEqual([]);
					});
				});

				describe('when css file does not exist', () => {
					const setup = () => {
						const service = module.get(H5PLibraryManagementService);

						libraryStorage.getAllLibraryFolders.mockResolvedValueOnce(['libraryA-1.0']);
						libraryStorage.fileExists.mockResolvedValueOnce(true);
						libraryStorage.getFileAsJson.mockResolvedValueOnce({
							machineName: 'libraryA',
							majorVersion: 1,
							minorVersion: 0,
							patchVersion: 1,
						});
						libraryStorage.isInstalled.mockResolvedValueOnce(true);
						libraryStorage.getInstalledLibraryNames.mockResolvedValueOnce([
							{
								machineName: 'libraryA',
								majorVersion: 1,
								minorVersion: 0,
							},
						]);
						libraryStorage.getLibrary.mockResolvedValueOnce({
							machineName: 'libraryA',
							majorVersion: 1,
							minorVersion: 0,
							patchVersion: 0,
							files: [],
							_id: new ObjectId(),
							id: 'mock_id',
							createdAt: new Date(),
							updatedAt: new Date(),
							restricted: false,
							runnable: true,
							title: 'Library A',
							compare: jest.fn(),
							compareVersions: jest.fn(),
						});
						libraryStorage.isInstalled.mockResolvedValueOnce(true);
						libraryStorage.getLibrary.mockResolvedValueOnce({
							machineName: 'libraryA',
							majorVersion: 1,
							minorVersion: 0,
							patchVersion: 0,
							files: [],
							_id: new ObjectId(),
							id: 'mock_id',
							createdAt: new Date(),
							updatedAt: new Date(),
							restricted: false,
							runnable: true,
							title: 'Library A',
							compare: jest.fn(),
							compareVersions: jest.fn(),
							preloadedJs: [{ path: 'path/to/preloaded.js' }],
							preloadedCss: [{ path: 'path/to/preloaded.css' }],
						});
						libraryStorage.fileExists.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

						return { service };
					};

					it('should return an empty result list', async () => {
						const { service } = setup();

						const synchronizedLibraries = await service.synchronizeDbEntryAndLibraryJson();

						expect(synchronizedLibraries).toEqual([]);
					});
				});
			});
		});

		describe('addLibrary', () => {
			describe('when a new library is available on S3', () => {
				const setup = () => {
					const service = module.get(H5PLibraryManagementService);

					libraryStorage.getAllLibraryFolders.mockResolvedValueOnce(['libraryA-1.0']);
					libraryStorage.fileExists.mockResolvedValueOnce(true);
					libraryStorage.getFileAsJson.mockResolvedValueOnce({
						machineName: 'libraryA',
						majorVersion: 1,
						minorVersion: 0,
						patchVersion: 1,
					});
					libraryStorage.isInstalled.mockResolvedValueOnce(false);
					libraryStorage.addLibrary.mockResolvedValueOnce({
						machineName: 'libraryA',
						majorVersion: 1,
						minorVersion: 0,
						patchVersion: 1,
						restricted: false,
						runnable: true,
						title: 'Library A',
						compare: jest.fn(),
						compareVersions: jest.fn(),
					});
					libraryStorage.isInstalled.mockResolvedValueOnce(true);
					libraryStorage.getLibrary.mockResolvedValueOnce({
						machineName: 'libraryA',
						majorVersion: 1,
						minorVersion: 0,
						patchVersion: 1,
						files: [],
						_id: new ObjectId(),
						id: 'mock_id',
						createdAt: new Date(),
						updatedAt: new Date(),
						restricted: false,
						runnable: true,
						title: 'Library A',
						compare: jest.fn(),
						compareVersions: jest.fn(),
						preloadedJs: [{ path: 'path/to/preloaded.js' }],
						preloadedCss: [{ path: 'path/to/preloaded.css' }],
					});
					libraryStorage.fileExists.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

					return { service };
				};

				it('should return an empty result list', async () => {
					const { service } = setup();

					const synchronizedLibraries = await service.synchronizeDbEntryAndLibraryJson();

					expect(synchronizedLibraries).toEqual([
						{
							newVersion: {
								machineName: 'libraryA',
								majorVersion: 1,
								minorVersion: 0,
								patchVersion: 1,
							},
							type: 'new',
						},
					]);
				});
			});

			describe('when an error occured in addLibrary', () => {
				const setup = () => {
					const service = module.get(H5PLibraryManagementService);

					libraryStorage.getAllLibraryFolders.mockResolvedValueOnce(['libraryA-1.0']);
					libraryStorage.fileExists.mockResolvedValueOnce(true);
					libraryStorage.getFileAsJson.mockResolvedValueOnce({
						machineName: 'libraryA',
						majorVersion: 1,
						minorVersion: 0,
						patchVersion: 1,
					});
					libraryStorage.isInstalled.mockResolvedValueOnce(false);
					libraryStorage.addLibrary.mockRejectedValueOnce(new Error('Mocked error during library addition'));
					libraryStorage.isInstalled.mockResolvedValueOnce(true);

					return { service };
				};

				it('should return an empty result list', async () => {
					const { service } = setup();

					const synchronizedLibraries = await service.synchronizeDbEntryAndLibraryJson();

					expect(synchronizedLibraries).toEqual([]);
				});
			});
		});

		describe('synchronizeLibraryToS3', () => {
			describe('when library.json is missing in library folder on S3', () => {
				const setup = () => {
					const service = module.get(H5PLibraryManagementService);

					libraryStorage.getAllLibraryFolders.mockResolvedValueOnce(['libraryA-1.0']);
					libraryStorage.fileExists.mockResolvedValueOnce(false);
					libraryStorage.getLibrary.mockResolvedValueOnce({
						machineName: 'libraryA',
						majorVersion: 1,
						minorVersion: 0,
						patchVersion: 0,
						files: [],
						_id: new ObjectId(),
						id: 'mock_id',
						createdAt: new Date(),
						updatedAt: new Date(),
						restricted: false,
						runnable: true,
						title: 'Library A',
						compare: jest.fn(),
						compareVersions: jest.fn(),
					});
					libraryStorage.addFile.mockResolvedValueOnce(true);

					return { service };
				};

				it('should return an empty result list', async () => {
					const { service } = setup();

					const synchronizedLibraries = await service.synchronizeDbEntryAndLibraryJson();

					expect(synchronizedLibraries).toEqual([]);
				});
			});

			describe('when getLibrary fails', () => {
				const setup = () => {
					const service = module.get(H5PLibraryManagementService);

					libraryStorage.getAllLibraryFolders.mockResolvedValueOnce(['libraryA-1.0']);
					libraryStorage.fileExists.mockResolvedValueOnce(false);
					libraryStorage.getLibrary.mockRejectedValueOnce(new Error('Mocked error during getLibrary'));

					return { service };
				};

				it('should return an empty result list', async () => {
					const { service } = setup();

					const synchronizedLibraries = await service.synchronizeDbEntryAndLibraryJson();

					expect(synchronizedLibraries).toEqual([]);
				});
			});

			describe('when addFile fails', () => {
				const setup = () => {
					const service = module.get(H5PLibraryManagementService);

					libraryStorage.getAllLibraryFolders.mockResolvedValueOnce(['libraryA-1.0']);
					libraryStorage.fileExists.mockResolvedValueOnce(false);
					libraryStorage.getLibrary.mockResolvedValueOnce({
						machineName: 'libraryA',
						majorVersion: 1,
						minorVersion: 0,
						patchVersion: 0,
						files: [],
						_id: new ObjectId(),
						id: 'mock_id',
						createdAt: new Date(),
						updatedAt: new Date(),
						restricted: false,
						runnable: true,
						title: 'Library A',
						compare: jest.fn(),
						compareVersions: jest.fn(),
					});
					libraryStorage.addFile.mockRejectedValueOnce(new Error('Mocked error during addFile'));

					return { service };
				};

				it('should return an empty result list', async () => {
					const { service } = setup();

					const synchronizedLibraries = await service.synchronizeDbEntryAndLibraryJson();

					expect(synchronizedLibraries).toEqual([]);
				});
			});
		});
	});
});
