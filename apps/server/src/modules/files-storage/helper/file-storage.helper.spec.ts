import { Test, TestingModule } from '@nestjs/testing';
import { FilesStorageHelper } from './files-storage.helper';

describe('FilesStorageHelper', () => {
	let module: TestingModule;
	let fileStorageHelper: FilesStorageHelper;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [FilesStorageHelper],
		}).compile();

		fileStorageHelper = module.get(FilesStorageHelper);
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(fileStorageHelper).toBeDefined();
	});
});
