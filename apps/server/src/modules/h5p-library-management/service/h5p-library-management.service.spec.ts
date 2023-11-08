/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { LibraryStorage } from '@src/modules/h5p-editor/service/libraryStorage.service';
import { ContentStorage } from '@src/modules/h5p-editor/service/contentStorage.service';
import ContentTypeCache from '@lumieducation/h5p-server/build/src/ContentTypeCache';
import LibraryAdministration from '@lumieducation/h5p-server/build/src/LibraryAdministration';
import { H5PLibraryManagementService } from './h5p-library-management.service';

describe('H5PLibraryManagementService', () => {
	let module: TestingModule;
	let service: H5PLibraryManagementService;
	let libraryStorageMock: jest.Mocked<LibraryStorage>;
	let libraryAdministrationMock: jest.Mocked<LibraryAdministration>;
	let contentTypeCacheMock: jest.Mocked<ContentTypeCache>;

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
					provide: LibraryAdministration,
					useValue: createMock<LibraryAdministration>(),
				},
			],
		}).compile();

		service = module.get(H5PLibraryManagementService);
		libraryStorageMock = module.get(LibraryStorage);
		libraryAdministrationMock = module.get(LibraryAdministration);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('uninstallUnwantedLibraries', () => {
		it('should delete libraries not in the wanted list and with no dependents', async () => {});

		it('should not delete libraries with dependents', async () => {});
	});

	describe('installLibraries', () => {
		it('should install all libraries in the list', async () => {});

		it('should throw an error if the library does not exist', async () => {});
	});
});
