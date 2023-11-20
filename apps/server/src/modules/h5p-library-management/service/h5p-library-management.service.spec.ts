import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { ContentStorage, LibraryStorage } from '@src/modules/h5p-editor/service';
import { IHubContentType, ILibraryAdministrationOverviewItem } from '@lumieducation/h5p-server/build/src/types';
import { s3ConfigContent, s3ConfigLibraries } from '@src/modules/h5p-editor/h5p-editor.config';
import { H5PLibraryManagementService } from './h5p-library-management.service';

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

	const setup = async () => {
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
			],
		}).compile();

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

	afterAll(async () => {
		await module.close();
	});

	describe('uninstallUnwantedLibraries', () => {
		it('should delete libraries not in the wanted list and with no dependents', async () => {
			const { service, libraryStorageMock, libraries } = await setup();
			await service.uninstallUnwantedLibraries(['a', 'b'], libraries);
			expect(libraryStorageMock.deleteLibrary).toHaveBeenCalledWith(libraries[2]);
		});

		it('should not delete libraries with dependents', async () => {
			const { service, libraryStorageMock, libraries } = await setup();
			libraryStorageMock.deleteLibrary = jest.fn().mockResolvedValue({});
			const wantedLibraries = ['a', 'b'];
			await service.uninstallUnwantedLibraries(wantedLibraries, libraries);
			expect(libraryStorageMock.deleteLibrary).not.toHaveBeenCalledWith({ machineName: 'b', dependentsCount: 1 });
		});
	});

	describe('installLibraries', () => {
		it('should install all libraries in the list', async () => {
			const { service } = await setup();
			const wantedLibraries = ['a', 'b', 'c'];
			const installContentTypeSpy = jest.spyOn(service.contentTypeRepo, 'installContentType').mockResolvedValue([]);
			await service.installLibraries(wantedLibraries);
			for (const libName of wantedLibraries) {
				expect(installContentTypeSpy).toHaveBeenCalledWith(libName, expect.anything());
			}
		});

		it('should throw an error if the library does not exist', async () => {
			const { service } = await setup();
			const nonExistentLibrary = 'nonExistentLibrary';
			jest.spyOn(service.contentTypeCache, 'get').mockResolvedValue(undefined as unknown as Promise<IHubContentType[]>);
			await expect(service.installLibraries([nonExistentLibrary])).rejects.toThrow('this library does not exist');
		});
	});

	describe('run', () => {
		it('should trigger uninstallUnwantedLibraries and installLibraries', async () => {
			const { service } = await setup();
			const uninstallSpy = jest.spyOn(service, 'uninstallUnwantedLibraries');
			const installSpy = jest.spyOn(service, 'installLibraries');

			uninstallSpy.mockResolvedValue(undefined);
			installSpy.mockResolvedValue(undefined);

			await service.run();

			expect(uninstallSpy).toHaveBeenCalledTimes(1);
			expect(installSpy).toHaveBeenCalledTimes(1);

			uninstallSpy.mockRestore();
			installSpy.mockRestore();
		});
	});
});

describe('config', () => {
	it('should get Object s3ConfigLibraries', () => {
		const s3ConfigLibrariesObj = s3ConfigLibraries;
		expect(s3ConfigLibrariesObj).toBeDefined();
	});
	it('should get Object s3ConfigLibraries', () => {
		const s3ConfigContentObj = s3ConfigContent;
		expect(s3ConfigContentObj).toBeDefined();
	});
});
