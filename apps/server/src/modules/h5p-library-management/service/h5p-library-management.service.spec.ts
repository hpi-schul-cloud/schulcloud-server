/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import {
	ContentStorage,
	LibraryStorage,
	s3ConfigContent,
	s3ConfigLibraries,
} from '@modules/h5p-editor/h5p-editor.module';
import { LibraryAdministration, ContentTypeCache } from '@lumieducation/h5p-server';
import { IHubContentType } from '@lumieducation/h5p-server/build/src/types';
import { H5PLibraryManagementService } from './h5p-library-management.service';

jest.mock('@lumieducation/h5p-server', () => {
	return {
		...jest.requireActual('@lumieducation/h5p-server'),
		LibraryAdministration: jest.fn().mockImplementation(() => {
			return {
				getLibraries: jest.fn().mockResolvedValue([
					{ machineName: 'a', dependentsCount: 0 },
					{ machineName: 'b', dependentsCount: 1 },
					{ machineName: 'c', dependentsCount: 0 },
				]),
			};
		}),
	};
});

describe('H5PLibraryManagementService', () => {
	let module: TestingModule;
	let service: H5PLibraryManagementService;
	let libraryStorageMock: DeepMocked<LibraryStorage>;

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
			],
		}).compile();

		service = module.get(H5PLibraryManagementService);
		libraryStorageMock = module.get(LibraryStorage);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('uninstallUnwantedLibraries', () => {
		it('should delete libraries not in the wanted list and with no dependents', async () => {
			const s3ConfigLibrariess = s3ConfigLibraries;
			libraryStorageMock.deleteLibrary = jest.fn().mockResolvedValue({});
			await service.uninstallUnwantedLibraries(['a', 'b']);
			expect(libraryStorageMock.deleteLibrary).toHaveBeenCalledWith({ machineName: 'c', dependentsCount: 0 });
			expect(libraryStorageMock.deleteLibrary).not.toHaveBeenCalledWith({ machineName: 'a', dependentsCount: 0 });
		});

		it('should not delete libraries with dependents', async () => {
			libraryStorageMock.deleteLibrary = jest.fn().mockResolvedValue({});
			const wantedLibraries = ['a', 'b'];
			await service.uninstallUnwantedLibraries(wantedLibraries);
			expect(libraryStorageMock.deleteLibrary).not.toHaveBeenCalledWith({ machineName: 'b', dependentsCount: 1 });
		});
	});

	describe('installLibraries', () => {
		it('should install all libraries in the list', async () => {
			const wantedLibraries = ['a', 'b', 'c'];
			const installContentTypeSpy = jest.spyOn(service.contentTypeRepo, 'installContentType').mockResolvedValue([]);
			await service.installLibraries(wantedLibraries);
			for (const libName of wantedLibraries) {
				expect(installContentTypeSpy).toHaveBeenCalledWith(libName, expect.anything());
			}
		});

		it('should throw an error if the library does not exist', async () => {
			const nonExistentLibrary = 'nonExistentLibrary';
			jest.spyOn(service.contentTypeCache, 'get').mockResolvedValue(undefined as unknown as Promise<IHubContentType[]>);
			await expect(service.installLibraries([nonExistentLibrary])).rejects.toThrow('this library does not exist');
		});
	});

	describe('run', () => {
		it('should trigger uninstallUnwantedLibraries and installLibraries', async () => {
			const uninstallSpy = jest.spyOn(service, 'uninstallUnwantedLibraries');
			const installSpy = jest.spyOn(service, 'installLibraries');

			uninstallSpy.mockResolvedValue(undefined);
			installSpy.mockResolvedValue(undefined);

			await service.run();

			expect(uninstallSpy).toHaveBeenCalledWith(service.libraryWishList);
			expect(installSpy).toHaveBeenCalledWith(service.libraryWishList);

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
