import { Logger } from '@core/logger';
import { createMock } from '@golevelup/ts-jest';
import {
	IHubContentType,
	ILibraryAdministrationOverviewItem,
	ILibraryInstallResult,
} from '@lumieducation/h5p-server/build/src/types';
import { ContentStorage, LibraryStorage } from '@modules/h5p-editor/service';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { H5PLibraryManagementErrorLoggable } from '../loggable/h5p-library-management-error.loggable';
import { IH5PLibraryManagementConfig } from './h5p-library-management.config';
import { H5PLibraryManagementService, castToLibrariesContentType } from './h5p-library-management.service';

jest.mock('@lumieducation/h5p-server', () => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return {
		...jest.requireActual('@lumieducation/h5p-server'),
		LibraryAdministration: jest.fn().mockImplementation(() => {
			return {
				getLibraries: jest.fn().mockResolvedValue([
					{ machineName: 'a', dependentsCount: 0 },
					{ machineName: 'b', dependentsCount: 1 },
					{ machineName: 'c', dependentsCount: 0 },
				]),
				deleteLibraries: jest.fn().mockResolvedValue({}),
			};
		}),
	};
});

describe('H5PLibraryManagementService', () => {
	let module: TestingModule;

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
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('uninstallUnwantedLibraries is called', () => {
		describe('when wantedLibraries have no dependands', () => {
			const setup = () => {
				const libraries: ILibraryAdministrationOverviewItem[] = [
					{
						canBeDeleted: true,
						canBeUpdated: true,
						dependentsCount: 0,
						instancesAsDependencyCount: 0,
						instancesCount: 0,
						isAddon: false,
						machineName: 'a',
						majorVersion: 1,
						minorVersion: 1,
						patchVersion: 1,
						restricted: false,
						runnable: true,
						title: 'a',
					},
					{
						canBeDeleted: true,
						canBeUpdated: true,
						dependentsCount: 1,
						instancesAsDependencyCount: 0,
						instancesCount: 0,
						isAddon: false,
						machineName: 'b',
						majorVersion: 1,
						minorVersion: 1,
						patchVersion: 1,
						restricted: false,
						runnable: true,
						title: 'b',
					},
					{
						canBeDeleted: true,
						canBeUpdated: true,
						dependentsCount: 0,
						instancesAsDependencyCount: 0,
						instancesCount: 0,
						isAddon: false,
						machineName: 'c',
						majorVersion: 1,
						minorVersion: 1,
						patchVersion: 1,
						restricted: false,
						runnable: true,
						title: 'c',
					},
				];
				const service = module.get(H5PLibraryManagementService);
				const libraryStorageMock = module.get(LibraryStorage);

				return { service, libraryStorageMock, libraries };
			};
			it('should delete libraries not in the wanted list and with no dependents', async () => {
				const { service, libraryStorageMock, libraries } = setup();
				const wantedLibraries = ['a', 'c'];
				await service.uninstallUnwantedLibraries(wantedLibraries, libraries);
				expect(libraryStorageMock.deleteLibrary).toHaveBeenCalledWith(libraries[0]);
				expect(libraryStorageMock.deleteLibrary).not.toHaveBeenCalledWith(libraries[1]);
				expect(libraryStorageMock.deleteLibrary).not.toHaveBeenCalledWith(libraries[2]);
			});
		});

		describe('when wantedLIbraries have dependands', () => {
			const setup = () => {
				const libraries: ILibraryAdministrationOverviewItem[] = [
					{
						canBeDeleted: true,
						canBeUpdated: true,
						dependentsCount: 0,
						instancesAsDependencyCount: 0,
						instancesCount: 0,
						isAddon: false,
						machineName: 'a',
						majorVersion: 1,
						minorVersion: 1,
						patchVersion: 1,
						restricted: false,
						runnable: true,
						title: 'a',
					},
					{
						canBeDeleted: true,
						canBeUpdated: true,
						dependentsCount: 1,
						instancesAsDependencyCount: 0,
						instancesCount: 0,
						isAddon: false,
						machineName: 'b',
						majorVersion: 1,
						minorVersion: 1,
						patchVersion: 1,
						restricted: false,
						runnable: true,
						title: 'b',
					},
					{
						canBeDeleted: true,
						canBeUpdated: true,
						dependentsCount: 0,
						instancesAsDependencyCount: 0,
						instancesCount: 0,
						isAddon: false,
						machineName: 'c',
						majorVersion: 1,
						minorVersion: 1,
						patchVersion: 1,
						restricted: false,
						runnable: true,
						title: 'c',
					},
				];
				const service = module.get(H5PLibraryManagementService);
				const libraryStorageMock = module.get(LibraryStorage);

				return { service, libraryStorageMock, libraries };
			};
			it('should not delete libraries with dependents', async () => {
				const { service, libraryStorageMock, libraries } = setup();
				libraryStorageMock.deleteLibrary = jest.fn().mockResolvedValueOnce({});
				const wantedLibraries = ['a', 'b'];
				await service.uninstallUnwantedLibraries(wantedLibraries, libraries);
				expect(libraryStorageMock.deleteLibrary).toHaveBeenCalledWith(libraries[0]);
				expect(libraryStorageMock.deleteLibrary).not.toHaveBeenCalledWith(libraries[1]);
				expect(libraryStorageMock.deleteLibrary).toHaveBeenCalledWith(libraries[2]);
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
				const installContentTypeSpy = jest.spyOn(service.contentTypeRepo, 'installContentType').mockResolvedValue([]);
				jest.spyOn(service.contentTypeCache, 'get').mockResolvedValue([]);
				await service.installLibraries(wantedLibraries);
				for (const libName of wantedLibraries) {
					expect(installContentTypeSpy).toHaveBeenCalledWith(libName, expect.anything());
				}
			});
		});

		describe('when libraries does not exist', () => {
			const setup = () => {
				const service = module.get(H5PLibraryManagementService);

				return { service };
			};
			it('should throw an error if the library does not exist', async () => {
				const { service } = setup();
				const nonExistentLibrary = 'nonExistentLibrary';
				jest
					.spyOn(service.contentTypeCache, 'get')
					.mockResolvedValueOnce(undefined as unknown as Promise<IHubContentType[]>);
				await expect(service.installLibraries([nonExistentLibrary])).rejects.toThrow('this library does not exist');
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

				await service.installLibraries([library]);

				expect(logger.warning).toHaveBeenCalledWith(new H5PLibraryManagementErrorLoggable(library, error));
			});
		});
	});

	describe('run is called', () => {
		describe('when run has been called successfully', () => {
			const setup = () => {
				const uninstalledLibraries: ILibraryAdministrationOverviewItem[] = [
					{
						canBeDeleted: true,
						canBeUpdated: true,
						dependentsCount: 0,
						instancesAsDependencyCount: 0,
						instancesCount: 0,
						isAddon: false,
						machineName: 'a',
						majorVersion: 1,
						minorVersion: 1,
						patchVersion: 1,
						restricted: false,
						runnable: true,
						title: 'a',
					},
					{
						canBeDeleted: true,
						canBeUpdated: true,
						dependentsCount: 1,
						instancesAsDependencyCount: 0,
						instancesCount: 0,
						isAddon: false,
						machineName: 'b',
						majorVersion: 1,
						minorVersion: 1,
						patchVersion: 1,
						restricted: false,
						runnable: true,
						title: 'b',
					},
					{
						canBeDeleted: true,
						canBeUpdated: true,
						dependentsCount: 0,
						instancesAsDependencyCount: 0,
						instancesCount: 0,
						isAddon: false,
						machineName: 'c',
						majorVersion: 1,
						minorVersion: 1,
						patchVersion: 1,
						restricted: false,
						runnable: true,
						title: 'c',
					},
				];
				const installedLibraries: ILibraryInstallResult[] = [
					{
						newVersion: {
							machineName: 'd',
							majorVersion: 1,
							minorVersion: 1,
							patchVersion: 1,
						},
						oldVersion: undefined,
						type: 'new',
					},
					{
						newVersion: {
							machineName: 'e',
							majorVersion: 1,
							minorVersion: 1,
							patchVersion: 1,
						},
						oldVersion: {
							machineName: 'e',
							majorVersion: 2,
							minorVersion: 2,
							patchVersion: 2,
						},
						type: 'patch',
					},
					{
						newVersion: undefined,
						oldVersion: undefined,
						type: 'none',
					},
				];
				const service = module.get(H5PLibraryManagementService);

				return { installedLibraries, service, uninstalledLibraries };
			};
			it('should trigger uninstallUnwantedLibraries and installLibraries', async () => {
				const { installedLibraries, service, uninstalledLibraries } = setup();
				const uninstallSpy = jest
					.spyOn(service, 'uninstallUnwantedLibraries')
					.mockResolvedValueOnce(uninstalledLibraries);
				const installSpy = jest.spyOn(service, 'installLibraries').mockResolvedValueOnce(installedLibraries);

				await service.run();

				expect(uninstallSpy).toHaveBeenCalledTimes(1);
				expect(installSpy).toHaveBeenCalledTimes(1);

				uninstallSpy.mockRestore();
				installSpy.mockRestore();
			});
		});
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
});
