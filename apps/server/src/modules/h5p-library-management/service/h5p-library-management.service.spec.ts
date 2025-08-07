import { Logger } from '@core/logger';
import { createMock } from '@golevelup/ts-jest';
import {
	IHubContentType,
	ILibraryAdministrationOverviewItem,
	ILibraryInstallResult,
} from '@lumieducation/h5p-server/build/src/types';
import { ContentStorage, LibraryStorage } from '@modules/h5p-editor';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { H5PLibraryManagementErrorLoggable } from '../loggable/h5p-library-management-error.loggable';
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

	describe('run is called', () => {
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
			it('should trigger uninstallUnwantedLibraries and installLibraries', async () => {
				const { installedLibraries, service, synchronizedLibraries, uninstalledLibraries } = setup();

				const uninstallSpy = jest
					.spyOn(service, 'uninstallUnwantedLibrariesAsBulk')
					.mockResolvedValueOnce(uninstalledLibraries);
				const installSpy = jest.spyOn(service, 'installLibrariesAsBulk').mockResolvedValueOnce(installedLibraries);
				const synchronizeSpy = jest.spyOn(service, 'synchronizeLibraries').mockResolvedValueOnce(synchronizedLibraries);

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

	describe('uninstallUnwantedLibraries is called', () => {
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

				return { service, wantedLibraries, expectedUninstalled };
			};

			it('should uninstall unwanted libraries and return the list of uninstalled libraries', async () => {
				const { service, wantedLibraries, expectedUninstalled } = setup();

				service.libraryWishList = wantedLibraries;

				// Call the method to uninstall unwanted libraries
				// This will use the mocked getLibraries and deleteLibrary methods

				const result = await service.uninstallUnwantedLibrariesAsBulk();

				expect(result).toEqual(expectedUninstalled);
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

				return { service, wantedLibraries, expectedUninstalled };
			};

			it('should uninstall unwanted libraries except the failed library and return the list of uninstalled libraries', async () => {
				const { service, wantedLibraries, expectedUninstalled } = setup();

				service.libraryWishList = wantedLibraries;

				// Call the method to uninstall unwanted libraries
				// This will use the mocked getLibraries and deleteLibrary methods

				const result = await service.uninstallUnwantedLibrariesAsBulk();

				expect(result).toEqual(expectedUninstalled);
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

				return { service, wantedLibraries };
			};

			it('should return an empty list', async () => {
				const { service, wantedLibraries } = setup();

				service.libraryWishList = wantedLibraries;

				const result = await service.uninstallUnwantedLibrariesAsBulk();

				expect(result).toEqual([]);
			});
		});
	});

	describe('installLibraries is called', () => {
		describe('when libraries exist', () => {
			const setup = () => {
				const service = module.get(H5PLibraryManagementService);

				return { service };
			};
			it('should install all libraries in the list', async () => {
				const { service } = setup();
				const wantedLibraries = ['a', 'b', 'c'];
				const availableLibraries: ILibraryAdministrationOverviewItem[] = [];

				service.libraryWishList = wantedLibraries;

				const installContentTypeSpy = jest.spyOn(service.contentTypeRepo, 'installContentType').mockResolvedValue([]);
				jest.spyOn(service.contentTypeCache, 'get').mockResolvedValue([]);

				await service.installLibrariesAsBulk(availableLibraries);
				for (const libName of wantedLibraries) {
					expect(installContentTypeSpy).toHaveBeenCalledWith(libName, expect.anything());
				}
			});
		});

		describe('when library does not exist', () => {
			const setup = () => {
				const service = module.get(H5PLibraryManagementService);

				return { service };
			};
			it('should not install library', async () => {
				const { service } = setup();
				const nonExistentLibrary = 'nonExistentLibrary';
				const availableLibraries: ILibraryAdministrationOverviewItem[] = [];

				service.libraryWishList = [nonExistentLibrary];

				const installContentTypeSpy = jest.spyOn(service.contentTypeRepo, 'installContentType');
				jest
					.spyOn(service.contentTypeCache, 'get')
					.mockResolvedValueOnce(undefined as unknown as Promise<IHubContentType[]>);

				await service.installLibrariesAsBulk(availableLibraries);

				expect(installContentTypeSpy).not.toHaveBeenCalled();
			});
		});

		describe('when contentTypeRepo.installContentType rejects with an error', () => {
			const setup = () => {
				const service = module.get(H5PLibraryManagementService);
				const logger = module.get(Logger);

				const library = 'mock-library';
				const error = new Error('Mock installation error');

				jest.spyOn(service.contentTypeCache, 'get').mockResolvedValueOnce([]);
				jest.spyOn(service.contentTypeRepo, 'installContentType').mockRejectedValueOnce(error);

				return { service, logger, library, error };
			};

			it('should log the error using H5PLibraryManagementLoggable', async () => {
				const { service, logger, library, error } = setup();
				const availableLibraries: ILibraryAdministrationOverviewItem[] = [];

				service.libraryWishList = [library];

				await service.installLibrariesAsBulk(availableLibraries);

				expect(logger.warning).toHaveBeenCalledWith(new H5PLibraryManagementErrorLoggable(error, { library }));
			});
		});
	});
});
