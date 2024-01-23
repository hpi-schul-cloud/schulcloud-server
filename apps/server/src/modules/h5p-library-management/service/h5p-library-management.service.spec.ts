import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { ContentStorage, LibraryStorage } from '@src/modules/h5p-editor/service';
import { IHubContentType, ILibraryAdministrationOverviewItem } from '@lumieducation/h5p-server/build/src/types';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { H5PLibraryManagementService, castToLibrariesContentType } from './h5p-library-management.service';
import { IH5PLibraryManagementConfig } from './h5p-library-management.config';

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
	});

	describe('run is called', () => {
		describe('when run has been called successfully', () => {
			const setup = () => {
				const service = module.get(H5PLibraryManagementService);

				return { service };
			};
			it('should trigger uninstallUnwantedLibraries and installLibraries', async () => {
				const { service } = setup();
				const uninstallSpy = jest.spyOn(service, 'uninstallUnwantedLibraries').mockResolvedValueOnce(undefined);
				const installSpy = jest.spyOn(service, 'installLibraries').mockResolvedValueOnce(undefined);

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
